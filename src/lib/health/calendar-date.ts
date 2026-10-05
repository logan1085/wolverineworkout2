/** UTC calendar arithmetic shared by training modes; no local DST offsets. */
export const calendarDate=(value:unknown):value is string=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function addDays(date:string,count:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
