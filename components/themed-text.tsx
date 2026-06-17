import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  className?: string;
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  className,
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      className={[
        type === 'default' ? 'text-base leading-6' : undefined,
        type === 'title' ? 'text-[32px] font-bold leading-8' : undefined,
        type === 'defaultSemiBold' ? 'text-base font-semibold leading-6' : undefined,
        type === 'subtitle' ? 'text-xl font-bold' : undefined,
        type === 'link' ? 'text-base leading-[30px]' : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={[{ color: type === 'link' ? '#0a7ea4' : color }, style]}
      {...rest}
    />
  );
}
