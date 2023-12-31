import deprecated from "deprecated-decorator";
import { Client as DClient, GatewayIntentsString } from "discord.js";

export class Client extends DClient
{
    private _token: string;

    public constructor(options: Client.Options)
    {
        super({
            intents: options.intents == "all"
            ? [
                "Guilds",
                "GuildMembers",
                "GuildModeration",
                "GuildEmojisAndStickers",
                "GuildIntegrations",
                "GuildWebhooks",
                "GuildInvites",
                "GuildVoiceStates",
                "GuildPresences",
                "GuildMessages",
                "GuildMessageReactions",
                "GuildMessageTyping",
                "DirectMessages",
                "DirectMessageReactions",
                "DirectMessageTyping",
                "MessageContent",
                "GuildScheduledEvents",
                "AutoModerationConfiguration",
                "AutoModerationExecution"
            ]
            : options.intents
        });

        this._token = options.token;
    }

    /** @deprecated */
    @deprecated()
    public onReady(code: (client: DClient<true>) => Promise<void> | void = () => console.log("I am ready")): void
    {
        this.on("ready", (client) => code(client));
    }

    /**
     * `client.login(...)` analog
     */
    public async init(): Promise<void>
    {
        await super.login(this._token);
    }
}

export namespace Client
{
    export interface Options
    {
        intents: GatewayIntentsString[] | "all";
        token: string;
    }
}

export default Client;