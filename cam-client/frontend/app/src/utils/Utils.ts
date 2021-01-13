import Config from "./Config";

export default class Utils {
    public static async getConfig(): Promise<Config> {
        const fetchResult = await fetch("config/config.json");
        return fetchResult.json();
    }
}