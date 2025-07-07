import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BarChart3, TrendingUp, Users, Calendar, Target, Award } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

export default function TrainerAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coming Soon Section */}
        <View style={styles.comingSoonContainer}>
          <View style={styles.iconContainer}>
            <BarChart3 size={64} color={colors.primary} />
          </View>
          
          <Text style={styles.comingSoonTitle}>Analytics Dashboard</Text>
          <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
          
          <Text style={styles.comingSoonDescription}>
            Get detailed insights into your training performance, client progress, and business metrics.
          </Text>

          {/* Feature Preview */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Coming:</Text>
            
            <View style={styles.featureItem}>
              <TrendingUp size={20} color={colors.success} />
              <Text style={styles.featureText}>Performance Trends</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.featureText}>Client Progress Analytics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Calendar size={20} color={colors.warning} />
              <Text style={styles.featureText}>Session Statistics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Target size={20} color={colors.error} />
              <Text style={styles.featureText}>Goal Achievement Rates</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Award size={20} color={colors.info} />
              <Text style={styles.featureText}>Revenue Insights</Text>
            </View>
          </View>

          {/* Placeholder Cards */}
          <View style={styles.placeholderCards}>
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderHeader}>
                <View style={styles.placeholderIcon} />
                <View style={styles.placeholderText} />
              </View>
              <View style={styles.placeholderChart} />
            </View>
            
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderHeader}>
                <View style={styles.placeholderIcon} />
                <View style={styles.placeholderText} />
              </View>
              <View style={styles.placeholderChart} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  placeholderCards: {
    width: '100%',
    gap: 16,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    marginRight: 12,
  },
  placeholderText: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  placeholderChart: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
});