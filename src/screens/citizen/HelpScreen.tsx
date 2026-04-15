// Help & Support screen — explains Aqarya's product areas and trust system.
// Linked from CitizenProfileScreen's Support section.
// Content is loaded from backend-managed content blocks when available;
// falls back to static strings if the network is unavailable.

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import Card from '../../components/Card';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import {ContentBlock, getActiveContentBlocks} from '../../api/cms';

// Keys that map to the fixed-layout sections
const SECTION_KEYS = ['help_buy', 'help_rent', 'help_invest', 'help_trust', 'help_support'];

const HelpSection = ({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) => (
  <Card variant="default" padding="md" style={styles.card}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionBody}>{body}</Text>
  </Card>
);

const HelpScreen = () => {
  const strings = useStrings();
  const [blocks, setBlocks] = useState<ContentBlock[] | null>(null);

  useEffect(() => {
    getActiveContentBlocks()
      .then(data => setBlocks(data))
      .catch(() => {
        // Fall back silently to static strings
        setBlocks([]);
      });
  }, []);

  // Helper: find a block by key, with fallback value
  const block = (key: string): ContentBlock | undefined =>
    blocks?.find(b => b.key === key);

  const introBlock = blocks?.find(b => b.key === 'help_intro_title');

  if (blocks === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  const introTitle = introBlock?.title ?? strings.help.introTitle;
  const introBody = introBlock?.body ?? strings.help.introBody;

  const sections: {key: string; icon: string; title: string; body: string}[] = [
    {
      key: 'help_buy',
      icon: block('help_buy')?.icon ?? '🏠',
      title: block('help_buy')?.title ?? strings.help.buyTitle,
      body: block('help_buy')?.body ?? strings.help.buyBody,
    },
    {
      key: 'help_rent',
      icon: block('help_rent')?.icon ?? '🔑',
      title: block('help_rent')?.title ?? strings.help.rentTitle,
      body: block('help_rent')?.body ?? strings.help.rentBody,
    },
    {
      key: 'help_invest',
      icon: block('help_invest')?.icon ?? '◆',
      title: block('help_invest')?.title ?? strings.help.investTitle,
      body: block('help_invest')?.body ?? strings.help.investBody,
    },
    {
      key: 'help_trust',
      icon: block('help_trust')?.icon ?? '✓',
      title: block('help_trust')?.title ?? strings.help.trustTitle,
      body: block('help_trust')?.body ?? strings.help.trustBody,
    },
    {
      key: 'help_support',
      icon: block('help_support')?.icon ?? '💬',
      title: block('help_support')?.title ?? strings.help.supportTitle,
      body: block('help_support')?.body ?? strings.help.supportBody,
    },
  ];

  // Any extra blocks not in the fixed set (admin-added)
  const extraBlocks = blocks.filter(
    b => !SECTION_KEYS.includes(b.key) && b.key !== 'help_intro_title',
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      <View style={styles.intro}>
        <Text style={styles.introTitle}>{introTitle}</Text>
        <Text style={styles.introBody}>{introBody}</Text>
      </View>

      {sections.map(s => (
        <HelpSection key={s.key} icon={s.icon} title={s.title} body={s.body} />
      ))}

      {extraBlocks.map(b => (
        <HelpSection
          key={b.key}
          icon={b.icon ?? 'ℹ'}
          title={b.title}
          body={b.body}
        />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{strings.help.versionText}</Text>
        <Text style={styles.footerText}>{strings.help.poweredBy}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
  },
  intro: {
    backgroundColor: Colors.cardDark,
    borderRadius: 16,
    marginBottom: 12,
    padding: 20,
  },
  introTitle: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  introBody: {
    color: Colors.textOnDarkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    marginBottom: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 16,
    gap: 4,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HelpScreen;
