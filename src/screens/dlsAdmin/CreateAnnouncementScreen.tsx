import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {
  AnnouncementAudience,
  AnnouncementType,
  createAnnouncement,
} from '../../api/cms';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'CreateAnnouncement'>;

const FieldLabel = ({text}: {text: string}) => (
  <Text style={styles.fieldLabel}>{text}</Text>
);

const CreateAnnouncementScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const ca = strings.admin.createAnnouncement;

  const typeOptions: {label: string; value: AnnouncementType; desc: string}[] = [
    {label: ca.typeSystem, value: 'system', desc: ca.typeSystemDesc},
    {label: ca.typeInvestmentMilestone, value: 'investment_milestone', desc: ca.typeInvestmentMilestoneDesc},
    {label: ca.typeListingStatus, value: 'listing_status_change', desc: ca.typeListingStatusDesc},
  ];

  const audienceOptions: {label: string; value: AnnouncementAudience; desc: string}[] = [
    {label: strings.admin.audiences.all_citizens, value: 'all_citizens', desc: ca.audienceAllCitizensDesc},
    {label: strings.admin.audiences.all_providers, value: 'all_providers', desc: ca.audienceAllProvidersDesc},
    {label: strings.admin.audiences.one_user, value: 'one_user', desc: ca.audienceOneUserDesc},
  ];

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<AnnouncementType>('system');
  const [audience, setAudience] = useState<AnnouncementAudience>('all_citizens');
  const [targetUserId, setTargetUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length >= 3 &&
    body.trim().length >= 5 &&
    (audience !== 'one_user' || targetUserId.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        type,
        audience,
        ...(audience === 'one_user' ? {targetUserId: targetUserId.trim()} : {}),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        ca.errorSendTitle,
        err instanceof Error ? err.message : ca.errorGeneric,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      {/* Message content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{ca.sectionMessage}</Text>

        <FieldLabel text={ca.labelTitle} />
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={ca.titlePlaceholder}
          placeholderTextColor={AC.textMuted}
          maxLength={120}
          accessibilityLabel="Announcement title"
        />

        <FieldLabel text={ca.labelBody} />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder={ca.bodyPlaceholder}
          placeholderTextColor={AC.textMuted}
          multiline
          numberOfLines={5}
          maxLength={1000}
          accessibilityLabel="Announcement body"
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{body.length}/1000</Text>
      </View>

      {/* Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{ca.sectionType}</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map(opt => {
            const isActive = type === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                style={[styles.typeChip, isActive && styles.typeChipActive]}
                accessibilityRole="radio"
                accessibilityState={{selected: isActive}}>
                <Text style={[styles.typeChipLabel, isActive && styles.typeChipLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.typeChipDesc, isActive && {color: AC.textSecondary}]}>
                  {opt.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Audience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{ca.sectionAudience}</Text>
        <View style={styles.audienceList}>
          {audienceOptions.map(opt => {
            const isActive = audience === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setAudience(opt.value)}
                style={[styles.audienceRow, isActive && styles.audienceRowActive]}
                accessibilityRole="radio"
                accessibilityState={{selected: isActive}}>
                <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
                <View style={styles.audienceCopy}>
                  <Text style={[styles.audienceLabel, isActive && {color: AC.textPrimary}]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.audienceDesc}>{opt.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {audience === 'one_user' ? (
          <View style={styles.targetUserWrapper}>
            <FieldLabel text={ca.labelTargetUserId} />
            <TextInput
              style={styles.input}
              value={targetUserId}
              onChangeText={setTargetUserId}
              placeholder={ca.userIdPlaceholder}
              placeholderTextColor={AC.textMuted}
              autoCapitalize="none"
              accessibilityLabel="Target user ID"
            />
          </View>
        ) : null}
      </View>

      {/* Submit */}
      <View style={styles.footer}>
        <Text style={styles.footerNote}>{ca.footerNote}</Text>
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={!canSubmit || isSubmitting}
          style={({pressed}) => [
            styles.submitBtn,
            (!canSubmit || isSubmitting) && styles.submitBtnDisabled,
            pressed && {opacity: 0.85},
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send announcement">
          {isSubmitting ? (
            <ActivityIndicator size="small" color={AC.white} />
          ) : (
            <Text style={styles.submitBtnText}>{ca.submitButton}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 40,
  },

  section: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  sectionTitle: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  fieldLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 10,
    borderWidth: 1,
    color: AC.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  charCount: {
    color: AC.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },

  // Type chips
  typeGrid: {
    gap: 8,
  },
  typeChip: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipActive: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  typeChipLabel: {
    color: AC.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  typeChipLabelActive: {
    color: AC.accent,
  },
  typeChipDesc: {
    color: AC.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Audience options
  audienceList: {
    gap: 8,
  },
  audienceRow: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  audienceRowActive: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  radioCircle: {
    alignItems: 'center',
    borderColor: AC.textMuted,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    width: 18,
    flexShrink: 0,
  },
  radioCircleActive: {
    borderColor: AC.accent,
  },
  radioInner: {
    backgroundColor: AC.accent,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  audienceCopy: {
    flex: 1,
  },
  audienceLabel: {
    color: AC.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  audienceDesc: {
    color: AC.textMuted,
    fontSize: 11,
    marginTop: 1,
  },

  targetUserWrapper: {
    gap: 6,
  },

  // Footer
  footer: {
    gap: 12,
    marginTop: 4,
  },
  footerNote: {
    color: AC.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: AC.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: AC.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default CreateAnnouncementScreen;
