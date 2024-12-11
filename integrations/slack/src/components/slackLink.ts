export function slackLink(url: string, text: string | number | bigint): string {
    return `<${url}|${text}>`;
}
