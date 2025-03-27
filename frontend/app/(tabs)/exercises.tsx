import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  SectionList,
  Text,
  SafeAreaView,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';
import { useExercises } from '../hooks/useExercises';
import { typography, colors, inputs, buttons } from '../shared/theme';
import LoadingOverlay from '../components/LoadingOverlay'; 
import { addExercise } from '../services/api'; 
import { AuthContext } from '../providers/AuthProvider';

const Exercises: React.FC = () => {
  const { logout, user } = React.useContext(AuthContext);

  const router = useRouter();
  const { exercises, searchQuery, setSearchQuery, isLoading, refetchExercises } = useExercises();

  const [showModal, setShowModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [refreshing, setRefreshing] = useState(false); 

  
  const onRefresh = async () => {
    setRefreshing(true); 
    await refetchExercises(); 
    setRefreshing(false); 
  };

  const handleAddExercise = async () => {
    try {
      if (!exerciseName || !selectedBodyPart) {
        alert('Please fill in both fields');
        return;
      }

      if (user?.token == undefined) {
        return;
      }

      await addExercise(user?.token, exerciseName, selectedBodyPart); 
      setShowModal(false);
      setExerciseName('');
      setSelectedBodyPart('');
      onRefresh();
      setSearchQuery((prev) => prev); 
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise. Please try again.');
    }
  };

  const getSectionData = () => {
    if (searchQuery) {
      return [{ title: '', data: exercises }];
    }

    const grouped = exercises.reduce((acc, exercise) => {
      const key = exercise.name[0].toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(exercise);
      return acc;
    }, {} as { [key: string]: typeof exercises });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  };

  const renderSectionHeader = ({ section: { title } }: any) => {
    if (!title) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
        <View style={styles.sectionDivider} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => console.log('Selected: ', item)}
    >
      <Text style={typography.exerciseName}>{item.name}</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.bodyPart}>{item.body_part}</Text>
        <Text style={styles.weightText}>{item.best_set}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Show loading overlay if isLoading is true */}
      <LoadingOverlay visible={isLoading} />

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TextInput
            style={[inputs.search, styles.searchBar]}
            placeholder="Search Exercises"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <PrimaryButton
            variant="primary"
            onPress={() => setShowModal(true)} 
            buttonStyle={styles.addButton}
            textStyle={styles.addButtonText}
          >
            +
          </PrimaryButton>
        </View>

        <SectionList
          sections={getSectionData()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.listFooter} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          stickySectionHeadersEnabled={!searchQuery} 
          
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]} 
              tintColor={colors.primary}
            />
          }
        />
      </View>

      {/* Modal for adding a new exercise */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Exercise Name"
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Body Part"
              value={selectedBodyPart}
              onChangeText={setSelectedBodyPart}
            />

            <PrimaryButton
              variant="primary"
              onPress={handleAddExercise}
              buttonStyle={[styles.addButton, buttons.fullWidth]}
            >
              Save
            </PrimaryButton>

            <PrimaryButton
              variant="secondary"
              onPress={() => setShowModal(false)}
              buttonStyle={[styles.cancelButton, buttons.fullWidth]}
            >
              Cancel
            </PrimaryButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: '75%',
    fontSize: 20,
  },
  addButton: {
    width: '20%',
    paddingVertical: 12,
    alignItems: 'center',
    textAlign: 'center',
  },
  addButtonText: {
    alignItems: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listFooter: {},
  sectionHeader: {
    backgroundColor: colors.background,
    marginTop: 0,
  },
  sectionHeaderText: {
    color: colors.text,
    fontSize: 24,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bodyPart: {
    color: colors.muted,
    fontSize: 14,
  },
  weightText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.border,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },
  modalInput: {
    ...inputs.search,
    marginBottom: 15,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: colors.secondary,
  },
});

export default Exercises;