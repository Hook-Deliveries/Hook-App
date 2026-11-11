declare module '*.gif' {
  const asset: number;
  export default asset;
}

declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.jpg' {
  const asset: number;
  export default asset;
}

declare module 'jsbarcode' {
  const JsBarcode: (target: unknown, value: string, options?: Record<string, unknown>) => void;
  export default JsBarcode;
}
