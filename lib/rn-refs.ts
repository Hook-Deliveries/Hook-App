import type { ComponentRef } from "react";
import type { ScrollView, TextInput, View } from "react-native";

export type ViewRef = ComponentRef<typeof View>;
export type ScrollViewRef = ComponentRef<typeof ScrollView>;
export type TextInputRef = ComponentRef<typeof TextInput>;
