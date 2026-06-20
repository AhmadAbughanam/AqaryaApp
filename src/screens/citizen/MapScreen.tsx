// Interactive map — Leaflet.js via WebView on CARTO Positron tiles (free, no API key).
// Satellite toggle via ESRI World Imagery (also free).
// Price pins appear for all properties that have latitude/longitude.
// Tapping a pin selects the property in the bottom carousel and vice versa.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {formatCurrencyNoDecimals} from '../../utils/formatters';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import MarketModeSwitcher from '../../components/MarketModeSwitcher';
import CitizenBrandBar from '../../components/CitizenBrandBar';
import {useInvestMode} from '../../store/investModeState';
import {useFocusEffect} from '@react-navigation/native';
import {getProperties, MarketType, PropertyListItem} from '../../api/properties';
import {getSavedItems, saveListing, unsaveListing} from '../../api/savedListings';
import {CitizenMapStackParamList} from '../../navigation/CitizenMapStack';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import {MarketMode} from '../../types/market';
import PropertyImage from '../../components/PropertyImage';
import {CitizenTabParamList} from '../../navigation/CitizenTabNavigator';
import {AppImages} from '../../assets/images';

type Props = NativeStackScreenProps<CitizenMapStackParamList, 'MapMain'>;

// ─── Layout constants ─────────────────────────────────────────────────────────

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const CARD_PAD = 16;
// Bottom sheet snap points — MIN leaves map visible, MAX keeps a sliver of map at top
const SHEET_MIN = 230;
const SHEET_MAX = Math.round(SCREEN_H * 0.66);
// Vertical card sizing for getItemLayout
const CARD_H = 162;
const CARD_GAP = 10;
const ITEM_H = CARD_H + CARD_GAP;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toMarketType = (mode: MarketMode): MarketType =>
  mode === 'buy' ? 'sale' : mode === 'rent' ? 'rent' : 'investment';

const formatCurrency = formatCurrencyNoDecimals;

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────
// CARTO Positron (street) + ESRI World Imagery (satellite) — both free, no API key.
// Communicates with React Native via window.ReactNativeWebView.postMessage ↔ injectJavaScript.

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><` + `/script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;background:#EDEDEB;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
    #map{width:100%;height:100%}
    .leaflet-control-attribution{font-size:9px!important;opacity:.6;background:rgba(255,255,255,.7)!important}

    /* ── Price marker ── */
    .pm-wrap{display:inline-flex;flex-direction:column;align-items:center;cursor:pointer}
    .pm{
      background:#fff;
      border:1.5px solid #D8D8D4;
      border-radius:100px;
      padding:5px 11px;
      font-size:12px;
      font-weight:800;
      color:#1A1A1A;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,.18),0 1px 2px rgba(0,0,0,.1);
      letter-spacing:.1px;
      user-select:none;
      -webkit-user-select:none;
    }
    .pm-tail{width:2px;height:6px;background:#D8D8D4;border-radius:1px}
    .pm-dot{width:5px;height:5px;border-radius:50%;background:#D8D8D4}

    /* Active */
    .pm.act{background:#1A1A1A;border-color:#1A1A1A;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.32);transform:scale(1.1)}
    /* Invest type */
    .pm.inv{border-color:#4A7A9B;color:#4A7A9B}
    .pm.inv.act{background:#4A7A9B;border-color:#4A7A9B;color:#fff}
    /* Rent type */
    .pm.rnt{border-color:#C9973E;color:#7A5C1E}
    .pm.rnt.act{background:#C9973E;border-color:#C9973E;color:#fff}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{center:[31.95,35.93],zoom:8,zoomControl:false});

  var streetLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {attribution:'© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>',subdomains:'abcd',maxZoom:20}
  );
  var satLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {attribution:'© Esri',maxZoom:20}
  );
  streetLayer.addTo(map);
  var isSat = false;

  var pins = {};
  var activeId = null;

  function shortPrice(v){
    if(v>=1e6) return '$'+(v/1e6).toFixed(1)+'M';
    if(v>=1e3) return '$'+Math.round(v/1e3)+'K';
    return '$'+v;
  }

  function typeClass(mt){
    return mt==='investment'?'inv':mt==='rent'?'rnt':'';
  }

  function tailColor(mt,active){
    if(!active) return '#D8D8D4';
    return mt==='investment'?'#4A7A9B':mt==='rent'?'#C9973E':'#1A1A1A';
  }

  function makeIcon(listing,active){
    var price=shortPrice(listing.price);
    var mt=listing.marketType||'sale';
    var cls='pm '+typeClass(mt)+(active?' act':'');
    var tc=tailColor(mt,active);
    var w=Math.max(46,20+price.length*8);
    var h=42; // bubble(28) + tail(6) + dot(5) + gaps(3)
    var html='<div class="pm-wrap">'
      +'<div class="'+cls+'">'+price+'</div>'
      +'<div class="pm-tail" style="background:'+tc+'"></div>'
      +'<div class="pm-dot" style="background:'+tc+'"></div>'
      +'</div>';
    return L.divIcon({
      className:'',
      html:html,
      iconSize:[w,h],
      iconAnchor:[w/2,h],
    });
  }

  function clearPins(){
    Object.values(pins).forEach(function(p){map.removeLayer(p.layer)});
    pins={};
  }

  function setMarkers(listings){
    clearPins();
    var bounds=[];
    listings.forEach(function(item,idx){
      if(item.latitude==null||item.longitude==null) return;
      var active=item.id===activeId;
      var layer=L.marker([item.latitude,item.longitude],{
        icon:makeIcon(item,active),
        zIndexOffset:active?2000:0,
      });
      layer.on('click',function(e){
        L.DomEvent.stopPropagation(e);
        postRN({type:'pin_tap',id:item.id,index:idx});
      });
      layer.addTo(map);
      pins[item.id]={layer:layer,listing:item,index:idx};
      bounds.push([item.latitude,item.longitude]);
    });

    if(bounds.length===1){
      map.flyTo(bounds[0],14,{duration:.6});
    } else if(bounds.length>1){
      map.flyToBounds(bounds,{padding:[70,70],maxZoom:14,duration:.7});
    } else {
      map.flyTo([31.95,35.93],8,{duration:.7});
    }
  }

  function activatePin(id,fly){
    // Reset old active
    if(activeId&&pins[activeId]){
      var old=pins[activeId];
      old.layer.setIcon(makeIcon(old.listing,false));
      old.layer.setZIndexOffset(0);
    }
    activeId=id;
    if(id&&pins[id]){
      var cur=pins[id];
      cur.layer.setIcon(makeIcon(cur.listing,true));
      cur.layer.setZIndexOffset(2000);
      if(fly&&cur.listing.latitude!=null&&cur.listing.longitude!=null){
        map.flyTo([cur.listing.latitude,cur.listing.longitude],14,{duration:.5,easeLinearity:.5});
      }
    }
  }

  function recenter(){
    var keys=Object.keys(pins);
    if(keys.length===0){map.flyTo([31.95,35.93],8,{duration:.7});return;}
    var bounds=keys.map(function(k){
      return[pins[k].listing.latitude,pins[k].listing.longitude];
    });
    if(bounds.length===1) map.flyTo(bounds[0],14,{duration:.6});
    else map.flyToBounds(bounds,{padding:[70,70],maxZoom:14,duration:.7});
  }

  function toggleSatellite(){
    if(isSat){map.removeLayer(satLayer);streetLayer.addTo(map);}
    else{map.removeLayer(streetLayer);satLayer.addTo(map);}
    isSat=!isSat;
  }

  function postRN(data){
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }

  function handleMsg(e){
    try{
      var d=JSON.parse(e.data);
      if(d.type==='set_markers') setMarkers(d.listings);
      else if(d.type==='activate') activatePin(d.id,d.fly);
      else if(d.type==='recenter') recenter();
      else if(d.type==='satellite') toggleSatellite();
      else if(d.type==='fly_to') map.flyTo([d.lat,d.lng],d.zoom||13,{duration:.7});
    }catch(err){}
  }

  document.addEventListener('message',handleMsg);
  window.addEventListener('message',handleMsg);

  map.whenReady(function(){postRN({type:'ready'})});
<` + `/script>
</body>
</html>`;

// ─── Property card ────────────────────────────────────────────────────────────

const PropertyCard = React.memo(({
  item,
  isSaved,
  isSelected,
  isDark,
  onPress,
  onToggleSave,
}: {
  item: PropertyListItem;
  isSaved: boolean;
  isSelected: boolean;
  isDark: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}) => {
  const hasCoords = item.latitude != null && item.longitude != null;
  const fundingPct = item.marketType === 'investment' && item.totalShares > 0
    ? Math.min((item.totalShares - item.availableShares) / item.totalShares, 1)
    : null;
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.card, isDark && styles.cardDark, isSelected && (isDark ? styles.cardSelectedDark : styles.cardSelected), pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}>

      <View style={styles.cardRow}>
        <PropertyImage
          imageUrls={item.imageUrls}
          marketType={item.marketType}
          style={styles.thumb}
          fallbackSource={
            item.marketType === 'investment'
              ? AppImages.property.investment.mapThumb
              : item.marketType === 'rent'
              ? AppImages.property.rent.mapThumb
              : AppImages.property.sale.mapThumb
          }>
          <View style={[styles.thumbBadge, item.marketType === 'investment' && styles.thumbBadgeInvest, item.marketType === 'rent' && styles.thumbBadgeRent]}>
            <Text style={styles.thumbBadgeText}>
              {item.marketType === 'investment' ? 'Invest' : item.marketType === 'rent' ? 'Rent' : 'Sale'}
            </Text>
          </View>
        </PropertyImage>

        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]} numberOfLines={2}>{item.title}</Text>
            <Pressable onPress={onToggleSave} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.cardHeart, isSaved && styles.cardHeartSaved]}>
                {isSaved ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          {item.verificationStatus === 'verified' && (
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={[styles.locationText, isDark && styles.locationTextDark]} numberOfLines={1}>
              {[item.city, item.location].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {!hasCoords && (
            <Text style={styles.noCoordHint}>Not on map</Text>
          )}
        </View>
      </View>

      <View style={[styles.cardDivider, isDark && styles.cardDividerDark]} />

      <View style={styles.cardPriceRow}>
        <Text style={[styles.cardPrice, isDark && styles.cardPriceDark]}>{formatCurrency(item.price)}</Text>
        <View style={styles.specs}>
          {item.areaSqm != null && <View style={[styles.specChip, isDark && styles.specChipDark]}><Text style={[styles.specText, isDark && styles.specTextDark]}>{item.areaSqm} m²</Text></View>}
          {item.bedrooms != null && <View style={[styles.specChip, isDark && styles.specChipDark]}><Text style={[styles.specText, isDark && styles.specTextDark]}>{item.bedrooms} bd</Text></View>}
          {item.bathrooms != null && <View style={[styles.specChip, isDark && styles.specChipDark]}><Text style={[styles.specText, isDark && styles.specTextDark]}>{item.bathrooms} ba</Text></View>}
        </View>
      </View>

      {fundingPct !== null && (
        <View style={styles.fundingBarRow}>
          <View style={styles.fundingBarTrack}>
            <View style={[styles.fundingBarFill, {width: `${Math.round(fundingPct * 100)}%`}]} />
          </View>
          <Text style={styles.fundingBarLabel}>{Math.round(fundingPct * 100)}% funded</Text>
        </View>
      )}
    </Pressable>
  );
});

// ─── Map controls overlay ─────────────────────────────────────────────────────

const MapControls = ({onRecenter, onSatellite, isSatellite, isDark}: {
  onRecenter: () => void;
  onSatellite: () => void;
  isSatellite: boolean;
  isDark: boolean;
}) => (
  <>
    <Pressable
      onPress={onRecenter}
      style={({pressed}) => [styles.controlBtn, isDark && styles.controlBtnDark, pressed && styles.controlBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Recenter map">
      <Text style={[styles.controlIcon, isDark && styles.controlIconDark]}>⊕</Text>
    </Pressable>
    <Pressable
      onPress={onSatellite}
      style={({pressed}) => [styles.controlBtn, isDark && styles.controlBtnDark, isSatellite && styles.controlBtnActive, pressed && styles.controlBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={isSatellite ? 'Switch to street map' : 'Switch to satellite'}>
      <Text style={[styles.controlIcon, isDark && styles.controlIconDark, isSatellite && styles.controlIconActive]}>
        {isSatellite ? '🗺' : '🛰'}
      </Text>
    </Pressable>
  </>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const MapScreen = ({navigation, route}: Props) => {
  const strings = useStrings();
  const webRef = useRef<WebView>(null);
  const listRef = useRef<FlatList<PropertyListItem>>(null);

  const [mapReady, setMapReady] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [marketMode, setMarketMode] = useState<MarketMode>('buy');
  const isDark = marketMode === 'invest';
  const {setIsInvest} = useInvestMode();

  useFocusEffect(
    useCallback(() => {
      const useDark = marketMode === 'invest';
      const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();
      const timers: Array<ReturnType<typeof setTimeout>> = [];

      const applyTheme = (dark: boolean) => {
        setIsInvest(dark);
        tabNav?.setOptions({
          tabBarStyle: dark ? styles.tabBarDarkOverride : undefined,
          tabBarActiveTintColor: dark ? '#7CBFAA' : undefined,
          tabBarInactiveTintColor: dark ? '#3A3A38' : undefined,
        });
      };

      applyTheme(useDark);
      if (useDark) {
        timers.push(setTimeout(() => applyTheme(true), 0));
        timers.push(setTimeout(() => applyTheme(true), 80));
      }

      return () => {
        timers.forEach(clearTimeout);
        applyTheme(false);
      };
    }, [marketMode, navigation, setIsInvest]),
  );

  const [listings, setListings] = useState<PropertyListItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // ── Draggable bottom sheet ─────────────────────────────────────────────────
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN)).current;
  const lastSheetH = useRef(SHEET_MIN);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, {dy}) => {
        const next = Math.max(SHEET_MIN, Math.min(SHEET_MAX, lastSheetH.current - dy));
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, {dy, vy}) => {
        const projected = lastSheetH.current - dy;
        const mid = (SHEET_MIN + SHEET_MAX) / 2;
        const snapTo = projected > mid || vy < -0.5 ? SHEET_MAX : SHEET_MIN;
        lastSheetH.current = snapTo;
        Animated.spring(sheetHeight, {
          toValue: snapTo,
          useNativeDriver: false,
          bounciness: 4,
          speed: 14,
        }).start();
      },
    }),
  ).current;

  // Controls float above the sheet as it expands
  const controlsBottom = Animated.add(sheetHeight, new Animated.Value(12));

  // ── Send a message to the Leaflet map ──────────────────────────────────────
  const toMap = useCallback((msg: object) => {
    const js = `handleMsg({data:${JSON.stringify(JSON.stringify(msg))}});true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  // ── Load saved items ───────────────────────────────────────────────────────
  useEffect(() => {
    getSavedItems()
      .then(items => {
        setSavedIds(new Set(
          items.filter(i => i.type === 'listing' && i.listing).map(i => i.listing!.id),
        ));
      })
      .catch(() => {/* non-critical */});
  }, []);

  // ── Fetch listings on mode change ──────────────────────────────────────────
  const fetchListings = useCallback(async (mode: MarketMode) => {
    setIsLoading(true);
    setError(null);
    setSelectedIdx(0);
    try {
      const res = await getProperties({marketType: toMarketType(mode), limit: 30});
      setListings(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load listings.');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings(marketMode);
  }, [marketMode, fetchListings]);

  // ── Push markers whenever map is ready and listings change ─────────────────
  useEffect(() => {
    if (!mapReady) return;
    toMap({type: 'set_markers', listings});
  }, [mapReady, listings, toMap]);

  // ── Fly to location passed from the Home city card (one-shot on ready) ─────
  useEffect(() => {
    const {initialLatitude, initialLongitude} = route.params ?? {};
    if (!mapReady || initialLatitude == null || initialLongitude == null) return;
    toMap({type: 'fly_to', lat: initialLatitude, lng: initialLongitude, zoom: 13});
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Select a listing (from carousel scroll or marker tap) ──────────────────
  const selectListing = useCallback((idx: number, flyToMarker: boolean) => {
    setSelectedIdx(idx);
    listRef.current?.scrollToIndex({index: idx, animated: true});
    const item = listings[idx];
    if (item) {
      toMap({type: 'activate', id: item.id, fly: flyToMarker});
    }
  }, [listings, toMap]);

  // ── Handle messages from the Leaflet map ───────────────────────────────────
  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const d = JSON.parse(e.nativeEvent.data) as {type: string; id?: string; index?: number};
      if (d.type === 'ready') {
        setMapReady(true);
      } else if (d.type === 'pin_tap' && d.index !== undefined) {
        // Marker tapped — update carousel but don't fly (map stays where user tapped)
        setSelectedIdx(d.index);
        listRef.current?.scrollToIndex({index: d.index, animated: true});
        if (d.id) toMap({type: 'activate', id: d.id, fly: false});
      }
    } catch {/* ignore */}
  }, [toMap]);

  const toggleSave = useCallback((id: string) => {
    const saved = savedIds.has(id);
    setSavedIds(prev => {
      const next = new Set(prev);
      saved ? next.delete(id) : next.add(id);
      return next;
    });
    (saved ? unsaveListing : saveListing)(id).catch(() => {
      setSavedIds(prev => {
        const next = new Set(prev);
        saved ? next.add(id) : next.delete(id);
        return next;
      });
    });
  }, [savedIds]);

  const onRecenter = useCallback(() => toMap({type: 'recenter'}), [toMap]);

  const onToggleSatellite = useCallback(() => {
    toMap({type: 'satellite'});
    setIsSatellite(v => !v);
  }, [toMap]);

  const getItemLayout = (_: ArrayLike<PropertyListItem> | null | undefined, index: number) => ({
    length: ITEM_H,
    offset: CARD_PAD + ITEM_H * index,
    index,
  });

  const renderItem = useCallback(({item, index}: {item: PropertyListItem; index: number}) => (
    <PropertyCard
      item={item}
      isSaved={savedIds.has(item.id)}
      isSelected={index === selectedIdx}
      isDark={isDark}
      onPress={() => {
        selectListing(index, true);
        navigation.navigate('PublicListingDetail', {
          id: item.id,
          marketType: isDark ? 'investment' : item.marketType,
        });
      }}
      onToggleSave={() => toggleSave(item.id)}
    />
  ), [isDark, savedIds, selectedIdx, navigation, toggleSave, selectListing]);

  const mappedCount = listings.filter(l => l.latitude != null && l.longitude != null).length;

  return (
    <View style={[styles.screen, isDark && styles.screenDark]}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, isDark && styles.topBarDark]}>
        <CitizenBrandBar
          isDark={isDark}
          right={
            <View style={[styles.countPill, isDark && styles.countPillDark]}>
              <Text style={[styles.countText, isDark && styles.countTextDark]}>
                {isLoading ? '…' : `${mappedCount} on map`}
              </Text>
            </View>
          }
        />
      </View>

      {/* ── Mode switcher ─────────────────────────────────────────────────── */}
      <View style={[styles.modeSwitcherRow, isDark && styles.modeSwitcherRowDark]}>
        <MarketModeSwitcher value={marketMode} onChange={setMarketMode} />
      </View>

      {/* ── Map + sheet container ─────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webRef}
          source={{html: MAP_HTML, baseUrl: 'https://localhost'}}
          style={StyleSheet.absoluteFill}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          androidLayerType="hardware"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />

        {/* Loading overlay while tiles fetch */}
        {isLoading && (
          <View style={styles.mapLoadingOverlay} pointerEvents="none">
            <View style={[styles.mapLoadingCard, isDark && styles.mapLoadingCardDark]}>
              <ActivityIndicator color={isDark ? '#4A7A9B' : Colors.primary} size="small" />
              <Text style={[styles.mapLoadingText, isDark && styles.mapLoadingTextDark]}>Loading properties…</Text>
            </View>
          </View>
        )}

        {/* Map controls — float above sheet and animate with it */}
        <Animated.View style={[styles.controls, {bottom: controlsBottom}]}>
          <MapControls
            onRecenter={onRecenter}
            onSatellite={onToggleSatellite}
            isSatellite={isSatellite}
            isDark={isDark}
          />
        </Animated.View>

        {/* ── Draggable bottom sheet ──────────────────────────────────────── */}
        <Animated.View style={[styles.sheet, isDark && styles.sheetDark, {height: sheetHeight}]}>
          {/* Drag handle — full-width touch target */}
          <View style={styles.dragBar} {...panResponder.panHandlers}>
            <View style={[styles.dragHandle, isDark && styles.dragHandleDark]} />
          </View>

          {error ? (
            <View style={styles.stateRow}>
              <Text style={[styles.stateError, isDark && styles.stateErrorDark]}>{error}</Text>
            </View>
          ) : listings.length === 0 && !isLoading ? (
            <View style={styles.stateRow}>
              <Text style={[styles.stateEmpty, isDark && styles.stateEmptyDark]}>{strings.map.noListingsTitle}</Text>
            </View>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetLabel, isDark && styles.sheetLabelDark]}>
                  {marketMode === 'buy' ? strings.home.saleListings
                    : marketMode === 'rent' ? strings.home.rentalListings
                    : strings.home.investmentProjects}
                </Text>
                {listings.length > 0 && (
                  <Text style={[styles.sheetCounter, isDark && styles.sheetCounterDark]}>{listings.length} listings</Text>
                )}
              </View>
              <FlatList
                ref={listRef}
                data={listings}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                getItemLayout={getItemLayout}
                contentContainerStyle={styles.listContent}
              />
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  screenDark: {
    backgroundColor: '#0D0D0C',
  },
  tabBarDarkOverride: {
    backgroundColor: '#111110',
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 1,
    elevation: 0,
    height: 62,
    paddingBottom: 10,
    paddingTop: 8,
    shadowOpacity: 0,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topBarDark: {
    backgroundColor: '#161615',
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  countPill: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countPillDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  countTextDark: {
    color: '#ADADAA',
  },

  // ── Mode switcher ─────────────────────────────────────────────────────────
  modeSwitcherRow: {
    backgroundColor: Colors.backgroundSecondary,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  modeSwitcherRowDark: {
    backgroundColor: '#0D0D0C',
  },

  // ── Map + sheet container ─────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapLoadingOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapLoadingCard: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    elevation: 8,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mapLoadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  mapLoadingCardDark: {
    backgroundColor: '#1E1E1C',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
  },
  mapLoadingTextDark: {
    color: '#ADADAA',
  },

  // ── Map controls ──────────────────────────────────────────────────────────
  controls: {
    gap: 10,
    position: 'absolute',
    right: 14,
  },
  controlBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 6,
    height: 44,
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.14,
    shadowRadius: 6,
    width: 44,
  },
  controlBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  controlBtnPressed: {
    opacity: 0.7,
  },
  controlIcon: {
    color: Colors.textPrimary,
    fontSize: 20,
  },
  controlIconActive: {
    color: Colors.white,
  },
  controlBtnDark: {
    backgroundColor: '#1E1E1C',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  controlIconDark: {
    color: '#E0E0DD',
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 16,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  sheetDark: {
    backgroundColor: '#161615',
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  // Full-width drag target above the handle pill
  dragBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: 12,
    width: '100%',
  },
  dragHandle: {
    backgroundColor: Colors.border,
    borderRadius: 3,
    height: 4,
    width: 44,
  },
  dragHandleDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: CARD_PAD,
  },
  sheetLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sheetLabelDark: {
    color: '#6B6B68',
  },
  sheetCounter: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sheetCounterDark: {
    color: '#4A4A48',
  },
  stateRow: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stateError: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  stateErrorDark: {
    color: '#FF6B6B',
  },
  stateEmpty: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  stateEmptyDark: {
    color: '#6B6B68',
  },
  listContent: {
    paddingHorizontal: CARD_PAD,
    paddingTop: CARD_PAD,
    paddingBottom: CARD_PAD,
  },

  // ── Property card ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: CARD_GAP,
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    width: SCREEN_W - CARD_PAD * 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  cardDark: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSelectedDark: {
    borderColor: '#4A7A9B',
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  thumb: {
    borderRadius: 12,
    flexShrink: 0,
    height: 84,
    overflow: 'hidden',
    position: 'relative',
    width: 84,
  },
  thumbGrid: {
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    left: 0,
    opacity: 0.1,
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  thumbDot: {
    backgroundColor: Colors.white,
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  thumbBadge: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 100,
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
  },
  thumbBadgeInvest: {
    backgroundColor: 'rgba(212,168,83,0.85)',
  },
  thumbBadgeRent: {
    backgroundColor: 'rgba(201,151,62,0.8)',
  },
  thumbBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  cardTitleDark: {
    color: '#E8E8E4',
  },
  cardHeart: {
    color: Colors.textMuted,
    fontSize: 18,
    paddingTop: 1,
  },
  cardHeartSaved: {
    color: '#FF4D6A',
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  verifiedDot: {
    backgroundColor: Colors.success,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  verifiedText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  locationPin: {
    fontSize: 11,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  locationTextDark: {
    color: '#6B6B68',
  },
  noCoordHint: {
    color: Colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  cardDivider: {
    backgroundColor: Colors.border,
    height: 1,
    marginBottom: 12,
  },
  cardDividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPrice: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardPriceDark: {
    color: '#E8E8E4',
  },
  specs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  specChip: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specChipDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  specText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  specTextDark: {
    color: '#6B6B68',
  },

  // ── Funding progress bar (investment cards only) ───────────────────────────
  fundingBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  fundingBarTrack: {
    backgroundColor: 'rgba(212,168,83,0.18)',
    borderRadius: 100,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fundingBarFill: {
    backgroundColor: '#D4A853',
    borderRadius: 100,
    height: '100%',
  },
  fundingBarLabel: {
    color: '#D4A853',
    fontSize: 10,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
});

export default MapScreen;
