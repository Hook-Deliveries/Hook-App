import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'hitArea' | 'blurredPill';
type ButtonSize = 'default' | 'icon' | 'wide' | 'auto';

type ButtonProps = PressableProps & {
  className?: string;
  labelClassName?: string;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseButton = 'items-center justify-center';

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-hook',
  secondary: 'bg-white',
  ghost: 'bg-transparent',
  hitArea: 'bg-transparent',
  blurredPill: 'overflow-hidden rounded-full border border-white/70 bg-white/10',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  default: 'h-[54px] rounded-full px-6',
  icon: 'h-[50px] w-[50px] rounded-full',
  wide: 'h-[54px] rounded-full px-6',
  auto: '',
};

const labelVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-black',
  secondary: 'text-hook-text',
  ghost: 'text-hook-text',
  hitArea: 'text-transparent',
  blurredPill: 'text-black',
};

function joinClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function buttonVariants({
  className,
  size = 'default',
  variant = 'primary',
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return joinClasses(baseButton, buttonVariantClasses[variant], buttonSizeClasses[size], className);
}

export function Button({
  className,
  labelClassName,
  title,
  variant = 'primary',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable className={buttonVariants({ className, size, variant })} {...props}>
      {children ?? (
        <Text className={joinClasses('text-base font-medium', labelVariantClasses[variant], labelClassName)}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
