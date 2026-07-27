import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  status?: 'online' | 'offline' | 'away';
};

export function Avatar({ name, status }: AvatarProps) {
  // Extrai as iniciais do nome exatamente como na lógica original da web
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarWrapper}>
      {/* O círculo principal do Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Renderiza o ponto de status dinamicamente apenas se ele for informado */}
      {status ? (
        <View style={[styles.statusDot, styles[status]]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24, // Metade do tamanho garante um círculo perfeito
    backgroundColor: '#3b82f6', // Um azul padrão elegante para o fundo
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7, // Metade do tamanho para manter redondo
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#111827', // Cor de fundo do card/lista para criar um efeito de recorte
  },
  // Variações de cor com base no status do usuário
  online: {
    backgroundColor: '#10b981', // Verde
  },
  offline: {
    backgroundColor: '#6b7280', // Cinza
  },
  away: {
    backgroundColor: '#f59e0b', // Laranja
  },
});
