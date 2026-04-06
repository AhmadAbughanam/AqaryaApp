/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/navigation/AppNavigator', () => {
  const mockReact = require('react');
  const {Text} = require('react-native');
  const MockNavigator = () =>
    mockReact.createElement(Text, null, 'App Navigator');
  return MockNavigator;
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
