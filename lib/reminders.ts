export type Reminder = {id:string;user_id:string;next_due:string;repeat_hours:number;enabled:boolean;created_at:string};
export function nextReminder(due:string,hours:number,now:number):string|null {
  if(![0,24,168].includes(hours))throw new Error("Invalid repeat schedule");
  const timestamp=Date.parse(due);if(!Number.isFinite(timestamp))throw new Error("Invalid reminder date");
  if(hours===0)return null;
  const interval=hours*3600000;
  return new Date(timestamp+(Math.floor(Math.max(0,now-timestamp)/interval)+1)*interval).toISOString();
}
