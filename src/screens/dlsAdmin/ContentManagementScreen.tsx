import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ContentBlock,
  getAdminContentBlocks,
  upsertContentBlock,
} from '../../api/cms';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type CMStrings = ReturnType<typeof useStrings>['admin']['contentManagement'];

const ContentBlockRow = ({
  block,
  cms,
  onSave,
}: {
  block: ContentBlock;
  cms: CMStrings;
  onSave: (key: string, title: string, body: string, icon: string, active: boolean) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [body, setBody] = useState(block.body);
  const [icon, setIcon] = useState(block.icon ?? '');
  const [active, setActive] = useState(block.active);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    title !== block.title ||
    body !== block.body ||
    icon !== (block.icon ?? '') ||
    active !== block.active;

  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await onSave(block.key, title, body, icon, active);
      setExpanded(false);
    } catch (err) {
      Alert.alert(cms.errorSaveTitle, err instanceof Error ? err.message : cms.errorSaveRetry);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.blockCard}>
      <Pressable
        onPress={() => setExpanded(v => !v)}
        style={styles.blockHeader}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${block.key}`}>
        <View style={styles.blockMeta}>
          {block.icon ? (
            <View style={styles.blockIconWrap}>
              <Text style={styles.blockIcon}>{block.icon}</Text>
            </View>
          ) : null}
          <View style={styles.blockMetaText}>
            <Text style={styles.blockTitle} numberOfLines={1}>
              {block.title}
            </Text>
            <Text style={styles.blockKey}>{block.key}</Text>
          </View>
        </View>
        <View style={styles.blockBadges}>
          <View
            style={[
              styles.activeBadge,
              {backgroundColor: block.active ? AC.successDim : AC.surfaceMid},
            ]}>
            <View
              style={[
                styles.activeDot,
                {backgroundColor: block.active ? AC.success : AC.textMuted},
              ]}
            />
            <Text
              style={[
                styles.activeBadgeText,
                {color: block.active ? AC.success : AC.textMuted},
              ]}>
              {block.active ? cms.statusActive : cms.statusInactive}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.editArea}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldFlex}>
              <Text style={styles.fieldLabel}>{cms.labelTitle}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                placeholderTextColor={AC.textMuted}
                accessibilityLabel="Block title"
              />
            </View>
            <View style={styles.fieldIcon}>
              <Text style={styles.fieldLabel}>{cms.labelIcon}</Text>
              <TextInput
                style={[styles.input, styles.iconInput]}
                value={icon}
                onChangeText={setIcon}
                maxLength={8}
                placeholder={cms.iconPlaceholder}
                placeholderTextColor={AC.textMuted}
                accessibilityLabel="Block icon"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{cms.labelBody}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            maxLength={2000}
            placeholderTextColor={AC.textMuted}
            textAlignVertical="top"
            accessibilityLabel="Block body"
          />

          <View style={styles.activeRow}>
            <View>
              <Text style={styles.activeRowLabel}>{cms.activeLabel}</Text>
              <Text style={styles.activeRowDesc}>{cms.activeDesc}</Text>
            </View>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{false: AC.surfaceMid, true: AC.success + '80'}}
              thumbColor={active ? AC.success : AC.textMuted}
              accessibilityLabel="Active toggle"
            />
          </View>

          <View style={styles.editFooter}>
            <Pressable
              onPress={() => {
                setTitle(block.title);
                setBody(block.body);
                setIcon(block.icon ?? '');
                setActive(block.active);
                setExpanded(false);
              }}
              style={({pressed}) => [styles.cancelBtn, pressed && {opacity: 0.65}]}
              accessibilityRole="button">
              <Text style={styles.cancelBtnText}>{cms.cancelButton}</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSave()}
              disabled={!isDirty || isSaving}
              style={[styles.saveBtn, (!isDirty || isSaving) && styles.saveBtnDisabled]}
              accessibilityRole="button">
              {isSaving ? (
                <ActivityIndicator size="small" color={AC.white} />
              ) : (
                <Text style={styles.saveBtnText}>{cms.saveButton}</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const ContentManagementScreen = () => {
  const strings = useStrings();
  const cms = strings.admin.contentManagement;
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAdminContentBlocks();
      setBlocks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : cms.errorLoad);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cms.errorLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (
    key: string,
    title: string,
    body: string,
    icon: string,
    active: boolean,
  ) => {
    const updated = await upsertContentBlock(key, {title, body, icon: icon || undefined, active});
    setBlocks(prev => prev.map(b => (b.key === key ? updated : b)));
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AC.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
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

      <Text style={styles.subtitle}>{cms.subtitle}</Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : blocks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{cms.emptyTitle}</Text>
          <Text style={styles.emptyText}>{cms.emptyText}</Text>
        </View>
      ) : (
        blocks.map(block => (
          <ContentBlockRow key={block.key} block={block} cms={cms} onSave={handleSave} />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    gap: 10,
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: AC.bg,
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: AC.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: AC.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: AC.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: AC.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Block card
  blockCard: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  blockMeta: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  blockIconWrap: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
    flexShrink: 0,
  },
  blockIcon: {
    fontSize: 18,
  },
  blockMetaText: {
    flex: 1,
  },
  blockTitle: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  blockKey: {
    color: AC.textMuted,
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 2,
  },
  blockBadges: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  activeBadge: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  expandIcon: {
    color: AC.textMuted,
    fontSize: 10,
  },

  // Edit area
  editArea: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    gap: 10,
    padding: 14,
    paddingTop: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldFlex: {
    flex: 1,
    gap: 4,
  },
  fieldIcon: {
    gap: 4,
    width: 64,
  },
  fieldLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 8,
    borderWidth: 1,
    color: AC.textPrimary,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  iconInput: {
    fontSize: 18,
    textAlign: 'center',
  },
  textArea: {
    height: 90,
    paddingTop: 9,
  },
  activeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  activeRowLabel: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeRowDesc: {
    color: AC.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  editFooter: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelBtn: {
    borderColor: AC.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: AC.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: AC.accent,
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: AC.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ContentManagementScreen;
