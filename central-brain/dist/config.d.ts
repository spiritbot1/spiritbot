/**
 * 中心大脑配置管理
 */
import 'dotenv/config';
export declare const config: {
    supabase: {
        url: string;
        serviceRoleKey: string;
    };
    ai: {
        apiKey: string;
        baseUrl: string;
        defaultModel: string;
        models: {
            light: string;
            standard: string;
            powerful: string;
            reasoning: string;
            coding: string;
        };
    };
    consciousness: {
        intervalMinutes: number;
        enableLearning: boolean;
        enableCuriosity: boolean;
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    creator: {
        userId: string;
    };
};
export declare function validateConfig(): boolean;
