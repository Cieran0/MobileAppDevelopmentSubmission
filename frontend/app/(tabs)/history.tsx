import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import HistoryCard from '../components/HistoryCard';
import { typography, colors } from '../shared/theme';
import { getHistory } from '../services/api';
import { AuthContext } from '../providers/AuthProvider';

const History: React.FC = () => {
  const { logout, user } = React.useContext(AuthContext);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const id = user?.token;

  
  const fetchHistory = async () => {
    if (id === undefined) {
      return;
    }

    try {
      const data = await getHistory(id);
      setHistoryData(data);
    } catch (error) {
      console.error('Failed to load history data', error);
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };

  
  useEffect(() => {
    fetchHistory();
  }, [id]);

  
  const sortedHistory = useMemo(() => {
    return [...historyData].sort((a, b) => b.date_epoch - a.date_epoch);
  }, [historyData]);

  
  const getSectionData = useMemo(() => {
    const grouped = sortedHistory.reduce((acc, session) => {
      const date = new Date(session.date_epoch * 1000);
      const monthYear = date.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(session);
      return acc;
    }, {} as { [key: string]: any[] });

    return Object.keys(grouped)
      .sort((a, b) => {
        const firstA = grouped[a][0].date_epoch;
        const firstB = grouped[b][0].date_epoch;
        return firstB - firstA;
      })
      .map((key) => ({
        title: key,
        data: grouped[key],
      }));
  }, [sortedHistory]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        sections={getSectionData}
        keyExtractor={(session) => session.date_epoch.toString()}
        renderItem={({ item }) => <HistoryCard session={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <View style={styles.sectionDivider} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
        
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true); 
              await fetchHistory(); 
            }}
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 8,
  },
  sectionSeparator: {
    height: 16,
  },
});

export default History;