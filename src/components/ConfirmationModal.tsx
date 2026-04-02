// Reusable confirmation dialog for irreversible admin actions.
import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import ActionButton from './ActionButton';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'neutral';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent
      onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <ActionButton
              title={cancelLabel}
              onPress={onCancel}
              variant="neutral"
              disabled={loading}
              style={styles.cancelButton}
            />
            <ActionButton
              title={confirmLabel}
              onPress={onConfirm}
              variant={confirmVariant}
              loading={loading}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    width: '100%',
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
  },
});

export default ConfirmationModal;
