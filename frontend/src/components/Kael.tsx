import { StyleSheet, View, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Kael() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../assets/kael.jpg')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: width * 0.28,
    height: height * 0.55,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
