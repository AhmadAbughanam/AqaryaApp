import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {getDashboardSummary, AdminDashboardSummary} from '../../api/admin';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';
import {
  BuildingIcon,
  ArrowUpIcon,
  PersonIcon,
  ShieldIcon,
  BarChartIcon,
  BellIcon,
  DocListIcon,
  PencilIcon,
} from '../../components/AdminIcon';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatTile = ({
  value,
  label,
  accent,
  accentColor,
}: {
  value: number;
  label: string;
  accent?: boolean;
  accentColor?: string;
}) => {
  const color = accentColor ?? AC.accent;
  return (
    <View style={[styles.statTile, accent && {borderColor: color + '55', borderWidth: 1}]}>
      {accent && <View style={[styles.statTileBar, {backgroundColor: color}]} />}
      <Text style={[styles.statValue, accent && {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const SectionLabel = ({text}: {text: string}) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

interface NavTile {
  key: keyof AdminStackParamList;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: number;
}

const NavTileCard = ({
  tile,
  onPress,
}: {
  tile: NavTile;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.navTile, pressed && styles.navTilePressed]}
    accessibilityRole="button">
    <View style={[styles.navTileIconWrap, {backgroundColor: tile.accentColor + '1A'}]}>
      {tile.icon}
    </View>
    <Text style={styles.navTileLabel} numberOfLines={2}>{tile.label}</Text>
    {tile.badge !== undefined && tile.badge > 0 ? (
      <View style={[styles.navTileBadge, {backgroundColor: tile.accentColor}]}>
        <Text style={styles.navTileBadgeText}>{tile.badge > 99 ? '99+' : tile.badge}</Text>
      </View>
    ) : null}
    <View style={[styles.navTileArrow, {borderColor: tile.accentColor + '40'}]}>
      <Text style={[styles.navTileArrowText, {color: tile.accentColor}]}>›</Text>
    </View>
  </Pressable>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AdminDashboardScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const d = strings.admin.dashboard;
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch {
      // non-critical — show static nav even without summary
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const navTiles = (s: AdminDashboardSummary): NavTile[] => [
    {key: 'PropertyVerification', label: d.tileSaleListings, icon: <BuildingIcon />, accentColor: AC.accent, badge: s.pendingListings},
    {key: 'InvestmentReview', label: d.tileInvestmentReview, icon: <ArrowUpIcon />, accentColor: AC.cyan, badge: s.pendingOpportunities},
    {key: 'UserManagement', label: d.tileUserManagement, icon: <PersonIcon />, accentColor: AC.success, badge: s.pendingProviders},
    {key: 'ModerationQueue', label: d.tileModeration, icon: <ShieldIcon />, accentColor: AC.danger, badge: s.openReports},
    {key: 'Analytics', label: d.tileAnalytics, icon: <BarChartIcon />, accentColor: AC.warning},
    {key: 'AnnouncementsManagement', label: d.tileAnnouncements, icon: <BellIcon />, accentColor: AC.accent, badge: s.activeAnnouncements},
    {key: 'AuditLogs', label: d.tileAuditLogs, icon: <DocListIcon />, accentColor: AC.textSecondary},
    {key: 'ContentManagement', label: d.tileHelpContent, icon: <PencilIcon />, accentColor: AC.cyan},
  ];

  const staticNavTiles: NavTile[] = [
    {key: 'PropertyVerification', label: d.tileSaleListings, icon: <BuildingIcon />, accentColor: AC.accent},
    {key: 'InvestmentReview', label: d.tileInvestmentReview, icon: <ArrowUpIcon />, accentColor: AC.cyan},
    {key: 'UserManagement', label: d.tileUserManagement, icon: <PersonIcon />, accentColor: AC.success},
    {key: 'ModerationQueue', label: d.tileModeration, icon: <ShieldIcon />, accentColor: AC.danger},
    {key: 'Analytics', label: d.tileAnalytics, icon: <BarChartIcon />, accentColor: AC.warning},
    {key: 'AnnouncementsManagement', label: d.tileAnnouncements, icon: <BellIcon />, accentColor: AC.accent},
    {key: 'AuditLogs', label: d.tileAuditLogs, icon: <DocListIcon />, accentColor: AC.textSecondary},
    {key: 'ContentManagement', label: d.tileHelpContent, icon: <PencilIcon />, accentColor: AC.cyan},
  ];

  const tiles = summary ? navTiles(summary) : staticNavTiles;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            void load();
          }}
          tintColor={AC.accent}
          colors={[AC.accent]}
        />
      }>

      {/* ── Header ── */}
      <View style={styles.pageHeader}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{d.live}</Text>
        </View>
        <Text style={styles.pageTitle}>{d.title}</Text>
        <Text style={styles.pageSubtitle}>{d.subtitle}</Text>
      </View>

      {/* ── Stats ── */}
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AC.accent} />
          <Text style={styles.loadingText}>{d.loadingSummary}</Text>
        </View>
      ) : summary ? (
        <>
          <SectionLabel text={d.sectionPlatformOverview} />
          <View style={styles.statsGrid}>
            <StatTile
              value={summary.pendingListings}
              label={d.statPendingListings}
              accent={summary.pendingListings > 0}
              accentColor={AC.accent}
            />
            <StatTile
              value={summary.pendingOpportunities}
              label={d.statPendingInvestments}
              accent={summary.pendingOpportunities > 0}
              accentColor={AC.cyan}
            />
            <StatTile
              value={summary.pendingProviders}
              label={d.statPendingProviders}
              accent={summary.pendingProviders > 0}
              accentColor={AC.success}
            />
            <StatTile
              value={summary.openThreads}
              label={d.statOpenThreads}
            />
            <StatTile
              value={summary.totalCitizenUsers}
              label={d.statCitizens}
            />
            {summary.openReports > 0 ? (
              <StatTile
                value={summary.openReports}
                label={d.statOpenReports}
                accent
                accentColor={AC.danger}
              />
            ) : null}
            {summary.flaggedItems > 0 ? (
              <StatTile
                value={summary.flaggedItems}
                label={d.statQualityFlags}
                accent
                accentColor={AC.warning}
              />
            ) : null}
          </View>

          {/* ── Recent Activity ── */}
          {summary.recentAuditHighlights.length > 0 ? (
            <>
              <SectionLabel text={d.sectionRecentActivity} />
              <View style={styles.auditCard}>
                {summary.recentAuditHighlights.map((event, idx) => (
                  <View
                    key={event.id}
                    style={[
                      styles.auditRow,
                      idx < summary.recentAuditHighlights.length - 1 && styles.auditRowBorder,
                    ]}>
                    <View style={styles.auditDot} />
                    <View style={styles.auditCopy}>
                      <Text style={styles.auditAction}>
                        {event.actionType.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.auditMeta}>
                        {event.actorName} ·{' '}
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {/* ── Navigation tiles ── */}
      <SectionLabel text={d.sectionOperations} />
      <View style={styles.navGrid}>
        {tiles.map(tile => (
          <NavTileCard
            key={tile.key}
            tile={tile}
            onPress={() => navigation.navigate(tile.key as never)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header
  pageHeader: {
    marginBottom: 24,
    marginTop: 4,
  },
  liveRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    backgroundColor: AC.success,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  liveText: {
    color: AC.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pageTitle: {
    color: AC.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: AC.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Loading
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  loadingText: {
    color: AC.textMuted,
    fontSize: 13,
  },

  // Section label
  sectionLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },

  // Stat tiles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statTile: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 80,
    overflow: 'hidden',
    padding: 14,
  },
  statTileBar: {
    borderRadius: 2,
    height: 3,
    marginBottom: 10,
    width: 28,
  },
  statValue: {
    color: AC.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: AC.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // Audit card
  auditCard: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  auditRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  auditRowBorder: {
    borderBottomColor: AC.border,
    borderBottomWidth: 1,
  },
  auditDot: {
    backgroundColor: AC.accent,
    borderRadius: 4,
    height: 8,
    marginTop: 5,
    width: 8,
    flexShrink: 0,
  },
  auditCopy: {
    flex: 1,
  },
  auditAction: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  auditMeta: {
    color: AC.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Nav tiles
  navGrid: {
    gap: 10,
  },
  navTile: {
    alignItems: 'center',
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  navTilePressed: {
    backgroundColor: AC.surfaceMid,
    opacity: 0.9,
  },
  navTileIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
    flexShrink: 0,
  },
  navTileLabel: {
    color: AC.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  navTileBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 5,
  },
  navTileBadgeText: {
    color: AC.white,
    fontSize: 10,
    fontWeight: '800',
  },
  navTileArrow: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  navTileArrowText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
});

export default AdminDashboardScreen;
