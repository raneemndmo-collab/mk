/**
 * Widget Tests — RTLSafeView Component
 *
 * Ensures RTL-safe layout with no marginLeft/marginRight.
 */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { RTLSafeView } from '@/components/RTLSafeView';

describe('RTLSafeView', () => {
  it('renders children', () => {
    const { getByText } = render(
      <RTLSafeView>
        <Text>محتوى اختباري</Text>
      </RTLSafeView>
    );
    expect(getByText('محتوى اختباري')).toBeTruthy();
  });

  it('applies row-reverse in RTL mode', () => {
    const { getByTestId } = render(
      <RTLSafeView row testID="rtl-view">
        <Text>عنصر</Text>
      </RTLSafeView>
    );
    const view = getByTestId('rtl-view');
    const flatStyle = Array.isArray(view.props.style)
      ? Object.assign({}, ...view.props.style.filter(Boolean))
      : view.props.style;
    // useI18n mock returns isRTL: true
    expect(flatStyle.flexDirection).toBe('row-reverse');
  });

  it('does not use marginLeft or marginRight', () => {
    const { getByTestId } = render(
      <RTLSafeView testID="rtl-view">
        <Text>عنصر</Text>
      </RTLSafeView>
    );
    const view = getByTestId('rtl-view');
    const flatStyle = Array.isArray(view.props.style)
      ? Object.assign({}, ...view.props.style.filter(Boolean))
      : view.props.style || {};
    expect(flatStyle.marginLeft).toBeUndefined();
    expect(flatStyle.marginRight).toBeUndefined();
  });

  it('snapshot matches', () => {
    const tree = render(
      <RTLSafeView row testID="rtl-view">
        <Text>محتوى</Text>
      </RTLSafeView>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
