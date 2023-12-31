import { accessSync, constants, mkdirSync, readFileSync, writeFileSync } from "fs";
import { eds } from "..";
import { eds_errors } from "../errors";
import deprecated from "deprecated-decorator";
import { writeFile } from "fs/promises";
import { deprecatedWarning } from "../Utils/DeprecatedWarning";

/**
 * A simple JSON database. Built on a `Map`-object
 * @deprecated
 */
export class Database<V extends eds.JSONSupportedValueTypes = eds.JSONSupportedValueTypes>
{
    /**
     * Raw map-object
     */
    public Map: Map<string, Database.Value<V>>;

    public constructor(private path: string, autosave?: boolean | number, private dump_path?: string)
    {
deprecatedWarning("Datebase", "Class");
        try {
            accessSync(path);
        } catch (err) {
            throw new Error(eds_errors.Database.invalidPath(path, err));
        }

        const entries: [string, Database.Value<V>][] = Object.entries(JSON.parse(readFileSync(path).toString() || "{}"));
        this.Map = new Map(entries);

        if (autosave)
        setInterval(() => this.save(), typeof autosave === "number" ? autosave : 60_000);

        if (dump_path)
        try {
            accessSync(dump_path, constants.R_OK | constants.W_OK);
        } catch (err)
        {
            const splitted = dump_path.replaceAll('\\', '/').split('/');
            mkdirSync(splitted.slice(0, -1).join('/'), { recursive: true });
            writeFileSync(splitted.join('/'), '{}');
        }
    }

    /** @deprecated */
    @deprecated()
    public save(): Promise<void>
    {
        return new Promise<void>(async () => {
            await writeFile(this.path, this.MapJSON);
            if (this.dump_path)
            writeFile(this.dump_path, this.MapJSON);
        });
    }

    /** @deprecated */
    @deprecated()
    public set(key: string, value: V, tags?: Database.TagsValues, save?: boolean): void
    {
        this.Map.set(key, [value, tags]);
        if (save) this.save();
    }
    
    /**
     * Adds a constant value to the database **(VERY SLOW)**
     * 
     * There is a mechanism of "references to keys"
     * @deprecated doesn't work
     */
    @deprecated("set")
    public setConst(key: string, value: V, tags?: Database.TagsValues, auto_ref: boolean = false, save?: boolean): void
    {
        if (auto_ref)
        {
            if (this.hasValue(value))
            {
                const vals = this.getKey(value).filter($ => this.getFull($)?.[1]?.$const$ === true);
                if (vals.length > 0)
                    this.set(key, null as V, { $const$: true, $ref$: vals[0] });
                else
                    this.set(key, value, Object.assign(tags ?? {}, { $const$: true }));
                //
            }
            else this.set(key, value, Object.assign(tags ?? {}, { $const$: true }));
        }
        else
            this.set(key, value, Object.assign(tags ?? {}, { $const$: true }));
        //
        if (save) this.save();
    }

    /** @deprecated */
    @deprecated()
    public get(key: string): V | undefined
    {
        const data = this.Map.get(key);
        if (data?.[1]?.$ref$)
            return this.get(data[1].$ref$);
        else
            return data?.[0];
        //
    }
    /** @deprecated */
    @deprecated()
    public getKey(value: V, single: boolean = false): string[]
    {
        const result: string[] = [];
        for (const ent of this.Map.entries())
            if (eds.equal(value, ent[0][1]))
            {
                result.push(ent[0]);
                if (single) break;
            }
        //
        return result;
    }
    /** @deprecated */
    @deprecated()
    public getFull(key: string): Database.Value<V> | undefined
    {
        const data = this.Map.get(key);
        if (data?.[1]?.$ref$)
            return this.getFull(data[1].$ref$);
        else
            return data;
        //
    }
    /** @deprecated */
    @deprecated()
    public has(key: string): boolean
    {
        return this.Map.has(key);
    }

    /** @deprecated */
    @deprecated()
    public hasValue(value: V): boolean
    {
        for (const val of this.Map.values())
        {
            if (eds.equal(value, val[0])) return true;
        }
        return false;
    }

    /** @deprecated */
    @deprecated()
    public del(key: string): void
    {
        this.Map.delete(key);
    }

    /**
     * Raw map-object in JSON format
     */
    public get MapJSON(): string
    {
        if (this.Map.size == 0) return "{}";
        let entries = "";

        this.Map.forEach((v, k) => {
            entries += ',\n\t' + `"${k}": ${JSON.stringify(v)}`
        });

        return '{' + entries.slice(1) + '\n}';
    }

    /**
     * Deletes all elements with `$weak$` tag
     * @returns number of deleted elements
     * @deprecated
     */
    @deprecated()
    public clearWeakData(): Promise<number>
    {
        return new Promise<number>((resolve) => {
            let i = 0;
            for (const [key, value] of this.Map.entries())
            {
                if (value[1]?.$weak$)
                {
                    this.Map.delete(key);
                    i++;
                }
            }
            this.save();
            resolve(i);
        });
    }
}

/** @deprecated */
namespace Database
{
    export type Tags = '$weak$' | '$const$' | '$ref$';
    export type TagsValues = {
        '$weak$'?: boolean;
        '$const$'?: boolean;
        '$ref$'?: string;
    };

    export type Value<V> = [V, TagsValues | undefined];
}

export default Database;