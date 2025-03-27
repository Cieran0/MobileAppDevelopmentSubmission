import { Exercise } from '@/app/types/workoutTypes';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';

interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBodyPart: string;
  setSelectedBodyPart: (part: string) => void;
  availableExercises: Exercise[];
  bodyParts: string[];
  onSelectExercise: (user_id: string, exercise: Exercise, isTemplate: boolean) => void;
  user_id: string | undefined;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  selectedBodyPart,
  setSelectedBodyPart,
  availableExercises,
  bodyParts,
  onSelectExercise,
  user_id,
}) => {
  const filtered = availableExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBody = selectedBodyPart === 'All' || ex.body_part === selectedBodyPart;
    return matchesSearch && matchesBody;
  });

  const getCount = (part: string) => {
    if (part === 'All') return availableExercises.length;
    return availableExercises.filter((ex) => ex.body_part === part).length;
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  if(user_id == undefined) {
    return;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={localStyles.modalContainer}>
        <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
          <Text style={localStyles.closeIcon}>×</Text>
        </TouchableOpacity>
        <TextInput
          style={localStyles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={localStyles.dropdownContainer}>
          <TouchableOpacity
            style={localStyles.dropdownTrigger}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={localStyles.dropdownTriggerText}>
              {selectedBodyPart} ({getCount(selectedBodyPart)})
            </Text>
            <Text style={localStyles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={localStyles.dropdownList}>
              <ScrollView>
                {bodyParts.map((part) => (
                  <TouchableOpacity
                    key={part}
                    style={localStyles.dropdownListItem}
                    onPress={() => {
                      setSelectedBodyPart(part);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={localStyles.dropdownListItemText}>
                      {part} ({getCount(part)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={localStyles.exerciseItem}
              onPress={() => onSelectExercise(user_id, item, false)}
            >
              <Text style={localStyles.dropdownListItemText}>{item.name}</Text>
              <Text style={localStyles.exerciseDetails}>{item.body_part}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={localStyles.emptyText}>No exercises found</Text>}
        />
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  dropdownContainer: {
    position: 'relative',
    marginVertical: 10,
    zIndex: 100,
  },
  dropdownTrigger: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  dropdownTriggerText: {
    color: '#FFF',
    fontSize: 14,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 14,
    marginLeft: 10,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  dropdownListItemText: {
    color: '#FFF',
    fontSize: 14,
  },
  exerciseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  exerciseDetails: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ExerciseModal;
