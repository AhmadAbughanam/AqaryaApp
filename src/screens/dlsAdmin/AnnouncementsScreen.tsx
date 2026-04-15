import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {
  Announcement,
  AnnouncementStatus,
  archiveAnnouncement,
  getAnnouncements,
} from '../../api/cms';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'AnnouncementsManagement'>;

const STATUS_COLOR: Record<AnnouncementStatus, string> = {
  active: AC.success,
  archived: AC.textMuted,
};

const AnnouncementRow = ({
  item,
  archiveLabel,
  statusLabel,
  audienceLabel,
  onArchive,
}: {
  item: Announcement;
  archiveLabel: string;
  statusLabel: string;
  audienceLabel: string;
  onArchive: () => void;
}) => {
  const color = STATUS_COLOR[item.status];
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccentBar, {backgroundColor: color}]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.statusPill, {backgroundColor: color + '22'}]}>
            <View style={[styles.statusDot, {backgroundColor: color}]} />
            <Text style={[styles.statusText, {color}]}>{statusLabel}</Text>
          </View>
          <View style={styles.audiencePill}>
            <Text style={styles.audienceText}>{audienceLabel}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body}
        </Text>

        {item.status === 'active' ? (
          <Pressable
            onPress={onArchive}
            style={({pressed}) => [styles.archiveBtn, pressed && {opacity: 0.6}]}
            accessibilityRole="button"
            accessibilityLabel="Archive announcement">
            <Text style={styles.archiveBtnText}>{archiveLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const AnnouncementsScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const ann = strings.admin.announcements;
  const filterOptions: {label: string; value: 'all' | AnnouncementStatus}[] = [
    {label: ann.filterAll, value: 'all'},
    {label: ann.filterActive, value: 'active'},
    {label: ann.filterArchived, value: 'archived'},
  ];

  const [items, setItems] = useState<Announcement[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | AnnouncementStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAnnouncements({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
      });
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ann.errorLoad);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, ann.errorLoad]);

  useEffect(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  const handleArchive = async (id: string) => {
    try {
      const updated = await archiveAnnouncement(id);
      setItems(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch {
      void load();
    }
  };

  return (
    <View style={styles.screen}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {filterOptions.map(opt => {
            const isActive = statusFilter === opt.value;
            const color =
              opt.value !== 'all' ? STATUS_COLOR[opt.value as AnnouncementStatus] : AC.accent;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  styles.chip,
                  isActive && {
                    backgroundColor: color + '22',
                    borderColor: color + '55',
                  },
                ]}>
                {isActive && opt.value !== 'all' && (
                  <View style={[styles.chipDot, {backgroundColor: color}]} />
                )}
                <Text style={[styles.chipText, isActive && {color}]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => navigation.navigate('CreateAnnouncement')}
          style={({pressed}) => [styles.newBtn, pressed && {opacity: 0.75}]}
          accessibilityRole="button"
          accessibilityLabel="Create new announcement">
          <Text style={styles.newBtnText}>{ann.newButton}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={AC.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <AnnouncementRow
              item={item}
              archiveLabel={ann.archiveButton}
              statusLabel={strings.admin.announcementStatuses[item.status]}
              audienceLabel={strings.admin.audiences[item.audience]}
              onArchive={() => void handleArchive(item.id)}
            />
          )}
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
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={styles.countText}>
                {items.length}{' '}
                {items.length !== 1 ? ann.announcementCountPlural : ann.announcementCount}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{ann.emptyTitle}</Text>
              <Text style={styles.emptyText}>{ann.emptyText}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  toolbar: {
    alignItems: 'center',
    backgroundColor: AC.surface,
    borderBottomColor: AC.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  chipText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  newBtn: {
    alignItems: 'center',
    backgroundColor: AC.accent,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  newBtnText: {
    color: AC.white,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 10,
    padding: 16,
    paddingBottom: 32,
  },
  countText: {
    color: AC.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  card: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccentBar: {
    width: 3,
  },
  cardInner: {
    flex: 1,
    gap: 8,
    padding: 14,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  audiencePill: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  audienceText: {
    color: AC.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    color: AC.textMuted,
    fontSize: 11,
    marginLeft: 'auto',
  },
  cardTitle: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardBody: {
    color: AC.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  archiveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  archiveBtnText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: AC.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: AC.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: AC.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AnnouncementsScreen;
