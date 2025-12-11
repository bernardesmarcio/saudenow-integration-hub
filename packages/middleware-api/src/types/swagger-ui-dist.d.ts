declare module "swagger-ui-dist/swagger-ui-bundle.js" {
  interface SwaggerUIBundleConfig {
    dom_id: string;
    spec?: object;
    url?: string;
    deepLinking?: boolean;
    presets?: any[];
    plugins?: any[];
    layout?: string;
    tryItOutEnabled?: boolean;
    filter?: boolean;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    onComplete?: () => void;
    onFailure?: (error: any) => void;
  }

  interface SwaggerUIBundle {
    (config: SwaggerUIBundleConfig): void;
    presets: {
      apis: any;
      standalone: any;
    };
    plugins: {
      DownloadUrl: any;
    };
  }

  const SwaggerUIBundle: SwaggerUIBundle;
  export default SwaggerUIBundle;
}
