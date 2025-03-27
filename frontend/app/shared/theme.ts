import { StyleSheet } from 'react-native';


export const colors = {
  primary: '#00FF88',
  secondary: '#2a2a2a',
  danger: '#FF3B30',
  background: '#0A0A0A',
  cardBackground: '#1A1A1A',
  text: '#FFFFFF',
  muted: '#888888',
  inactiveTab: '#111111',
  activeTab: '#00FF88',
  border: '#393939'
};


export const typography = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '300',
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1.1,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  timer: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  exerciseName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  headerText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});


export const layout = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cardBackground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
});


export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  fullWidth: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  logout: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#8b0000',
    backgroundColor: 'red',
  },
  addSet: {
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  finish: {
    backgroundColor: '#00FF88',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
  },
});


export const cards = StyleSheet.create({
  exercise: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
});


export const inputs = StyleSheet.create({
  base: {
    backgroundColor: colors.secondary,
    color: colors.text,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  numeric: {
    textAlign: 'center',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  search: {
    backgroundColor: colors.secondary,
    color: colors.text,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
});


export const toast = {
  container: {
    padding: 16,
    margin: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#330000',
  },
};