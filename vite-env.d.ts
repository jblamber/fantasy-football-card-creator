interface ImportMetaEnv {
    readonly VITE_AUTH0_DOMAIN: string;
    readonly VITE_AUTH0_CLIENT_ID: string;
    readonly VITE_AUTH0_API_AUDIENCE: string;
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}