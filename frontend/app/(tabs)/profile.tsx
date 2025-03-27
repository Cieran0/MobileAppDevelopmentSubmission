import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Dimensions, SafeAreaView, View, Text, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { colors, typography, buttons, layout } from '../shared/theme';
import { AuthContext } from '../providers/AuthProvider';
import BarGraph from '../components/BarGraph';
import LineGraph from '../components/LineGraph';
import { getWorkoutsPerWeek, getOneRepMax, getExercises } from '../services/api'; 
import LoadingOverlay from '../components/LoadingOverlay';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ProfileScreen: React.FC = () => {
  const { logout, user } = React.useContext(AuthContext);

  
  const [workoutsPerWeekData, setWorkoutsPerWeekData] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]); 
  const [widgets, setWidgets] = useState<any[]>([]); 
  const [refreshing, setRefreshing] = useState(false); 

  
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<number | null>(null);

  
  const fetchProfileData = async () => {
    if (!user?.token) return;

    try {
      
      const workoutsData = await getWorkoutsPerWeek(user.token);
      const exercisesData = await getExercises(user.token);

      
      const updatedWidgets = await Promise.all(
        widgets.map(async (widget) => ({
          ...widget,
          oneRepMaxData: await getOneRepMax(user.token, widget.exerciseId),
        }))
      );

      setWorkoutsPerWeekData(workoutsData);
      setExercises(exercisesData);
      setWidgets(updatedWidgets); 
    } catch (error) {
      console.error("Failed to refresh profile data:", error);
    } finally {
      setRefreshing(false); 
    }
  };

  
  useEffect(() => {
    if (!user?.token) return;
    fetchProfileData(); 
  }, [user?.token]);

  
  const fetchOneRepMaxData = async (exerciseId: number) => {
    try {
      if (!user?.token) return null;
      const data = await getOneRepMax(user.token, exerciseId); 
      return data;
    } catch (error) {
      console.error("Error fetching one rep max data:", error);
      return null;
    }
  };

  const addWidget = () => {
    if (exercises.length > 0) {
      
      const newWidget = {
        id: Date.now(), 
        exerciseId: exercises[0].id, 
        oneRepMaxData: null, 
      };

      
      fetchOneRepMaxData(exercises[0].id).then((data) => {
        newWidget.oneRepMaxData = data;
        setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
      });
    }
  };

  const removeWidget = (id: number) => {
    setWidgets((prevWidgets) => prevWidgets.filter((widget) => widget.id !== id));
    setModalVisible(false);
  };

  const handleExerciseSelect = (exerciseId: number) => {
    if (selectedWidgetId !== null) {
      
      const updatedWidgets = widgets.map((widget) =>
        widget.id === selectedWidgetId
          ? { ...widget, exerciseId, oneRepMaxData: null }
          : widget
      );
      setWidgets(updatedWidgets);

      
      fetchOneRepMaxData(exerciseId).then((data) => {
        const updatedWidgetsWithData = updatedWidgets.map((widget) =>
          widget.id === selectedWidgetId
            ? { ...widget, oneRepMaxData: data }
            : widget
        );
        setWidgets(updatedWidgetsWithData);
        setModalVisible(false);
      });
    }
  };

  const openExerciseModal = (widgetId: number) => {
    setSelectedWidgetId(widgetId);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true); 
              await fetchProfileData(); 
            }}
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.title}>{user?.username}</Text>
          <PrimaryButton
            variant="cancel"
            onPress={logout}
            buttonStyle={buttons.logout}
          >
            Logout
          </PrimaryButton>
        </View>

        {/* Workouts Per Week (Bar Chart) */}
        <View style={styles.chartContainer}>
          {workoutsPerWeekData ? (
            <BarGraph
              data={workoutsPerWeekData}
              barName="Workouts Per Week"
              width={screenWidth - 100}
              overrideMax={7}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <LoadingOverlay visible={true} />
            </View>
          )}
        </View>

        {/* Add widgets (Line Graphs) */}
        {widgets.map((widget) => {
          const selectedExercise = exercises.find((exercise) => exercise.id === widget.exerciseId);

          return (
            <View key={widget.id} style={styles.chartContainer}>
              <TouchableOpacity onPress={() => openExerciseModal(widget.id)} style={styles.chart}>
                {widget.oneRepMaxData ? (
                  <LineGraph
                    data={widget.oneRepMaxData}
                    lineName={selectedExercise ? `1 Rep Max (kg) - ${selectedExercise.name}` : '1 Rep Max'}
                    width={screenWidth - 100}
                  />
                ) : (
                  <View style={styles.loadingContainer}>
                    <LoadingOverlay visible={true} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add More Widgets Button */}
        <PrimaryButton
          variant="primary"
          onPress={addWidget}
          buttonStyle={styles.addWidgetButton}
          textStyle={styles.addWidgetText}
        >
          Add More Widgets
        </PrimaryButton>
      </ScrollView>

      {/* Modal for Exercise Selection */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={typography.title}>Choose Exercise</Text>
            <ScrollView style={styles.exerciseList}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleExerciseSelect(exercise.id)}
                  style={styles.exerciseItem}
                >
                  <Text style={typography.exerciseName}>{exercise.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <PrimaryButton
              variant="cancel"
              onPress={() => selectedWidgetId && removeWidget(selectedWidgetId)}
              buttonStyle={[buttons.logout, styles.deleteButton]}
            >
              Delete Widget
            </PrimaryButton>
            <PrimaryButton
              variant="secondary"
              onPress={() => setModalVisible(false)}
              buttonStyle={[styles.closeButton, buttons.fullWidth]}
            >
              Close
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
    padding: 20,
  },
  loadingContainer: {
    backgroundColor: colors.cardBackground,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1.5, 
    borderColor: '#393939', 
  },
  chart: {
    borderRadius: 16,
  },
  addWidgetButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  addWidgetText: {
    alignSelf: 'center',
    fontSize: 18,
    color: colors.background,
  },
  deleteButton: {
    paddingVertical: 10,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 0,
    width: '100%',
    alignSelf: 'center'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  modalContent: {
    maxHeight: '60%',
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    width:'90%',
    borderWidth: 1.5, 
    borderColor: '#393939', 
  },
  exerciseList: {
    marginVertical: 10,
  },
  exerciseItem: {
    paddingVertical: 10,
  },
  closeButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 15,
    marginTop: 10,
    textAlign: 'center'
  },
});

export default ProfileScreen;