import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Modal, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';
import TemplateCard from '../components/TemplateCard';
import AddTemplateButton from '../components/AddTemplateButton';
import { buttons, colors } from '../shared/theme';
import { getTemplates, createTemplate, getExercises } from '../services/api';
import { AuthContext } from '../providers/AuthProvider';

const Index: React.FC = () => {
  const router = useRouter();
  const { user } = React.useContext(AuthContext);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null); 

  
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user?.token) return;

      try {
        const data = await getTemplates(user.token);
        setTemplates(data);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user?.token]);

  
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        if (!user?.token) return;
        const exercises = await getExercises(user.token);
        setAllExercises(exercises);
      } catch (error) {
        console.error('Failed to load exercises:', error);
      }
    };

    fetchExercises();
  }, [user?.token]);

  const filteredExercises = allExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExerciseSelect = (exercise: any) => {
    if (selectedExercises.some((ex) => ex.id === exercise.id)) {
      Alert.alert('Duplicate Exercise', 'This exercise is already added.');
      return;
    }

    setSelectedExercises([...selectedExercises, { ...exercise, sets: 3 }]);
    setSearchQuery('');
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateName || selectedExercises.length === 0 || !user?.token) {
        Alert.alert('Error', 'Please enter a template name and select at least one exercise.');
        return;
      }

      const templateData = {
        name: templateName,
        user_id: user.token,
        exercises: selectedExercises.map((ex) => ({
          exercise_id: ex.id,
          sets: ex.sets,
        })),
      };

      await createTemplate(templateData);
      const updatedTemplates = await getTemplates(user.token);
      setTemplates(updatedTemplates);

      
      setIsModalVisible(false);
      setTemplateName('');
      setSelectedExercises([]);
      setSelectedExerciseId(null);
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save the template. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Template Creation Modal */}
      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Template</Text>
            <TouchableOpacity
              onPress={handleSaveTemplate}
              disabled={!templateName || selectedExercises.length === 0}
            >
              <Text
                style={[
                  styles.saveButton,
                  (!templateName || selectedExercises.length === 0) && { color: colors.muted },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Template Name Input */}
          <TextInput
            placeholder="Template name"
            value={templateName}
            onChangeText={setTemplateName}
            style={styles.modalInput}
            autoFocus
          />

          {/* Exercise Search Section */}
          <View style={styles.searchSection}>
            <TextInput
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise Results */}
          <FlatList
            data={filteredExercises}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseResult}
                onPress={() => handleExerciseSelect(item)}
              >
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseDetails}>{item.body_part}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={styles.noResults}>No exercises found</Text>}
          />

          {/* Selected Exercises Section */}
          {selectedExercises.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.sectionTitle}>Selected Exercises ({selectedExercises.length})</Text>
              <FlatList
                data={selectedExercises}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedExerciseId(item.id)} 
                    style={[
                      styles.selectedItem,
                      selectedExerciseId === item.id && { backgroundColor: colors.primary }, 
                    ]}
                  >
                    <View>
                      <Text style={styles.selectedName}>{item.name}</Text>
                      <Text style={styles.selectedDetails}>{item.body_part}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        value={item.sets.toString()}
                        onChangeText={(text) => {
                          const newSets = parseInt(text) || 0;
                          setSelectedExercises(
                            selectedExercises.map((ex) =>
                              ex.id === item.id ? { ...ex, sets: newSets } : ex
                            )
                          );
                        }}
                        keyboardType="numeric"
                        style={styles.setsInput}
                      />
                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedExercises(selectedExercises.filter((ex) => ex.id !== item.id));
                          setSelectedExerciseId(null); 
                        }}
                        style={{ marginLeft: 10 }}
                      >
                        <Text style={{ color: colors.danger }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Quick Start Section */}
        <View style={styles.quickStartSection}>
          <Text style={styles.title}>Quick Start</Text>
          <PrimaryButton
            variant="primary"
            onPress={() => router.push('/workout/WorkoutScreen')}
            buttonStyle={[buttons.primary, buttons.fullWidth]}
          >
            Start An Empty Workout
          </PrimaryButton>
        </View>

        {/* Templates Header */}
        <View style={styles.templatesHeader}>
          <Text style={styles.subtitle}>Templates</Text>
          <AddTemplateButton onPress={() => setIsModalVisible(true)} />
        </View>

        {/* Templates Container */}
        <View style={styles.templatesContainer}>
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                name={template.name}
                exercises={template.exercises}
                date={new Date(template.created_at).toLocaleDateString()}
                style={styles.templateCard}
                onPress={() =>
                  router.push({
                    pathname: '/workout/WorkoutScreen',
                    params: { template: JSON.stringify(template) },
                  })
                }
              />
            ))
          ) : (
            <Text style={styles.noTemplatesText}>No templates available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickStartSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  templatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '500',
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  templateCard: {
    width: '47.5%',
    marginBottom: 15,
  },
  noTemplatesText: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.primary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: colors.text,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
    color: colors.text,
  },
  clearText: {
    color: colors.primary,
    fontSize: 16,
  },
  exerciseResult: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  exerciseDetails: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    color: colors.muted,
  },
  selectedContainer: {
    paddingHorizontal: 20,
    borderColor: colors.border,
    borderTopWidth: 2,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  selectedName: {
    fontSize: 16,
    color: colors.text,
  },
  selectedDetails: {
    fontSize: 14,
    color: colors.muted,
  },
  setsInput: {
    width: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 4,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
  },
});

export default Index;