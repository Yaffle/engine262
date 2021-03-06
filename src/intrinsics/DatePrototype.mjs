import { surroundingAgent } from '../engine.mjs';
import {
  Assert,
  DateFromTime,
  Day,
  HourFromTime,
  Invoke,
  LocalTime,
  LocalTZA,
  MakeDate,
  MakeDay,
  MakeTime,
  MinFromTime,
  MonthFromTime,
  msFromTime,
  msPerMinute,
  OrdinaryToPrimitive,
  SecFromTime,
  TimeClip,
  TimeWithinDay,
  ToNumber,
  ToPrimitive,
  ToObject,
  UTC,
  WeekDay,
  YearFromTime,
} from '../abstract-ops/all.mjs';
import {
  Type,
  Value,
  wellKnownSymbols,
} from '../value.mjs';
import { Q } from '../completion.mjs';
import { BootstrapPrototype } from './Bootstrap.mjs';
import { msg } from '../helpers.mjs';

export function thisTimeValue(value) {
  if (Type(value) === 'Object' && 'DateValue' in value) {
    return value.DateValue;
  }
  return surroundingAgent.Throw('TypeError', 'this is not a Date object');
}

// 20.3.4.2 #sec-date.prototype.getdate
function DateProto_getDate(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return DateFromTime(LocalTime(t));
}

// 20.3.4.3 #sec-date.prototype.getday
function DateProto_getDay(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return WeekDay(LocalTime(t));
}

// 20.3.4.4 #sec-date.prototype.getfullyear
function DateProto_getFullYear(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return YearFromTime(LocalTime(t));
}

// 20.3.4.5 #sec-date.prototype.gethours
function DateProto_getHours(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return HourFromTime(LocalTime(t));
}

// 20.3.4.6 #sec-date.prototype.getmilliseconds
function DateProto_getMilliseconds(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return msFromTime(LocalTime(t));
}

// 20.3.4.7 #sec-date.prototype.getminutes
function DateProto_getMinutes(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return MinFromTime(LocalTime(t));
}

// 20.3.4.8 #sec-date.prototype.getmonth
function DateProto_getMonth(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return MonthFromTime(LocalTime(t));
}

// 20.3.4.9 #sec-date.prototype.getseconds
function DateProto_getSeconds(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return SecFromTime(LocalTime(t));
}

// 20.3.4.10 #sec-date.prototype.gettime
function DateProto_getTime(args, { thisValue }) {
  return Q(thisTimeValue(thisValue));
}

// 20.3.4.11 #sec-date.prototype.gettimezoneoffset
function DateProto_getTimezoneOffset(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return new Value(t.numberValue() - LocalTime(t).numberValue() / msPerMinute);
}

// 20.3.4.12 #sec-date.prototype.getutcdate
function DateProto_getUTCDate(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return DateFromTime(t);
}

// 20.3.4.13 #sec-date.prototype.getutcday
function DateProto_getUTCDay(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return WeekDay(t);
}

// 20.3.4.14 #sec-date.prototype.getutcfullyear
function DateProto_getUTCFullYear(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return YearFromTime(t);
}

// 20.3.4.15 #sec-date.prototype.getutchours
function DateProto_getUTCHours(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return HourFromTime(t);
}

// 20.3.4.16 #sec-date.prototype.getutcmilliseconds
function DateProto_getUTCMilliseconds(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return msFromTime(t);
}

// 20.3.4.17 #sec-date.prototype.getutcminutes
function DateProto_getUTCMinutes(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return MinFromTime(t);
}

// 20.3.4.18 #sec-date.prototype.getutcmonth
function DateProto_getUTCMonth(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return MonthFromTime(t);
}

// 20.3.4.19 #sec-date.prototype.getutcseconds
function DateProto_getUTCSeconds(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    return new Value(NaN);
  }
  return SecFromTime(t);
}

// 20.3.4.20 #sec-date.prototype.setdate
function DateProto_setDate([date = Value.undefined], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  const dt = Q(ToNumber(date));
  const newDate = MakeDate(MakeDay(YearFromTime(t), MonthFromTime(t), dt), TimeWithinDay(t));
  const u = TimeClip(UTC(newDate));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.21 #sec-date.prototype.setfullyear
function DateProto_setFullYear([year = Value.undefined, month, date], { thisValue }) {
  let t = Q(thisTimeValue(thisValue));
  t = t.isNaN() ? new Value(0) : LocalTime(t);
  const y = Q(ToNumber(year));
  const m = month ? Q(ToNumber(month)) : MonthFromTime(t);
  const dt = date ? Q(ToNumber(date)) : DateFromTime(t);
  const newDate = MakeDate(MakeDay(y, m, dt), TimeWithinDay(t));
  const u = TimeClip(UTC(newDate));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.22 #sec-date.prototype.sethours
function DateProto_setHours([hour = Value.undefined, min, sec, ms], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  const h = Q(ToNumber(hour));
  const m = min ? Q(ToNumber(min)) : MinFromTime(t);
  const s = sec ? Q(ToNumber(sec)) : SecFromTime(t);
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const date = MakeDate(Day(t), MakeTime(h, m, s, milli));
  const u = TimeClip(UTC(date));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.23 #sec-date.prototype.setmilliseconds
function DateProto_setMilliseconds([ms = Value.undefined], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  ms = Q(ToNumber(ms));
  const time = MakeTime(HourFromTime(t), MinFromTime(t), SecFromTime(t), ms);
  const u = TimeClip(UTC(MakeDate(Day(t), time)));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.24 #sec-date.prototype.setminutes
function DateProto_setMinutes([min = Value.undefined, sec, ms], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  const m = Q(ToNumber(min));
  const s = sec ? Q(ToNumber(sec)) : SecFromTime(t);
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const date = MakeDate(Day(t), MakeTime(HourFromTime(t), m, s, milli));
  const u = TimeClip(UTC(date));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.25 #sec-date.prototype.setmonth
function DateProto_setMonth([month = Value.undefined, date], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  const m = Q(ToNumber(month));
  const dt = date ? Q(ToNumber(date)) : DateFromTime(t);
  const newDate = MakeDate(MakeDay(YearFromTime(t), m, dt), TimeWithinDay(t));
  const u = TimeClip(UTC(newDate));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.26 #sec-date.prototype.setseconds
function DateProto_setSeconds([sec = Value.undefined, ms], { thisValue }) {
  const t = LocalTime(Q(thisTimeValue(thisValue)));
  const s = Q(ToNumber(sec));
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const date = MakeDate(Day(t), MakeTime(HourFromTime(t), MinFromTime(t), s, milli));
  const u = TimeClip(UTC(date));
  thisValue.DateValue = u;
  return u;
}

// 20.3.4.27 #sec-date.prototype.settime
function DateProto_setTime([time = Value.undefined], { thisValue }) {
  Q(thisTimeValue(thisValue));
  const t = Q(ToNumber(time));
  const v = TimeClip(t);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.28 #sec-date.prototype.setutcdate
function DateProto_setUTCDate([date = Value.undefined], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const dt = Q(ToNumber(date));
  const newDate = MakeDate(MakeDay(YearFromTime(t), MonthFromTime(t), dt), TimeWithinDay(t));
  const v = TimeClip(newDate);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.29 #sec-date.prototype.setutcfullyear
function DateProto_setUTCFullYear([year = Value.undefined, month, date], { thisValue }) {
  let t = Q(thisTimeValue(thisValue));
  if (t.isNaN()) {
    t = new Value(0);
  }
  const y = Q(ToNumber(year));
  const m = month ? Q(ToNumber(month)) : MonthFromTime(t);
  const dt = date ? Q(ToNumber(date)) : DateFromTime(t);
  const newDate = MakeDate(MakeDay(y, m, dt), TimeWithinDay(t));
  const v = TimeClip(newDate);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.30 #sec-date.prototype.setutchours
function DateProto_setUTCHours([hour = Value.undefined, min, sec, ms], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const h = Q(ToNumber(hour));
  const m = min ? Q(ToNumber(min)) : MinFromTime(t);
  const s = sec ? Q(ToNumber(sec)) : SecFromTime(t);
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const newDate = MakeDate(Day(t), MakeTime(h, m, s, milli));
  const v = TimeClip(newDate);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.31 #sec-date.prototype.setutcmilliseconds
function DateProto_setUTCMilliseconds([ms = Value.undefined], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const milli = Q(ToNumber(ms));
  const time = MakeTime(HourFromTime(t), MinFromTime(t), SecFromTime(t), milli);
  const v = TimeClip(MakeDate(Day(t), time));
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.32 #sec-date.prototype.setutcminutes
function DateProto_setUTCMinutes([min = Value.undefined, sec, ms], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const m = Q(ToNumber(min));
  const s = sec ? Q(ToNumber(sec)) : SecFromTime(t);
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const date = MakeDate(Day(t), MakeTime(HourFromTime(t), m, s, milli));
  const v = TimeClip(date);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.33 #sec-date.prototype.setutcmonth
function DateProto_setUTCMonth([month = Value.undefined, date], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const m = Q(ToNumber(month));
  const dt = date ? Q(ToNumber(date)) : DateFromTime(t);
  const newDate = MakeDate(MakeDay(YearFromTime(t), m, dt), TimeWithinDay(t));
  const v = TimeClip(newDate);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.34 #sec-date.prototype.setutcseconds
function DateProto_setUTCSeconds([sec = Value.undefined, ms], { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  const s = Q(ToNumber(sec));
  const milli = ms ? Q(ToNumber(ms)) : msFromTime(t);
  const date = MakeDate(Day(t), MakeTime(HourFromTime(t), MinFromTime(t), s, milli));
  const v = TimeClip(date);
  thisValue.DateValue = v;
  return v;
}

// 20.3.4.35 #sec-date.prototype.todatestring
function DateProto_toDateString(args, { thisValue }) {
  const O = thisValue;
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', msg('IncompatibleReceiver', 'Date.prototype.toDateString'));
  }
  const tv = Q(thisTimeValue(O));
  if (tv.isNaN()) {
    return new Value('Invalid Date');
  }
  const t = LocalTime(tv);
  return DateString(t);
}

// 20.3.4.36 #sec-date.prototype.toisostring
function DateProto_toISOString(args, { thisValue }) {
  const t = Q(thisTimeValue(thisValue));
  if (!Number.isFinite(t.numberValue())) {
    return surroundingAgent.Throw('RangeError', 'Invalid time value');
  }
  const year = YearFromTime(t).numberValue();
  const month = MonthFromTime(t).numberValue() + 1;
  const date = DateFromTime(t).numberValue();
  const hour = HourFromTime(t).numberValue();
  const min = MinFromTime(t).numberValue();
  const sec = SecFromTime(t).numberValue();
  const ms = msFromTime(t).numberValue();

  // TODO: figure out if there can be invalid years.
  let YYYY = String(year);
  if (year < 0 || year > 9999) {
    YYYY = year < 0 ? `-${String(year).padStart(6, '0')}` : `+${String(year).padStart(6, '0')}`;
  }
  const MM = String(month).padStart(2, '0');
  const DD = String(date).padStart(2, '0');
  const HH = String(hour).padStart(2, '0');
  const mm = String(min).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  const sss = String(ms).padStart(3, '0');
  const format = `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}.${sss}Z`;
  return new Value(format);
}

// 20.3.4.37 #sec-date.prototype.tojson
function DateProto_toJSON(args, { thisValue }) {
  const O = Q(ToObject(thisValue));
  const tv = Q(ToPrimitive(O, 'Number'));
  if (Type(tv) === 'Number' && !Number.isFinite(tv.numberValue())) {
    return Value.null;
  }
  return Q(Invoke(O, new Value('toISOString')));
}

// 20.3.4.38 #sec-date.prototype.tolocaledatestring
function DateProto_toLocaleDateString() {
  // TODO: implement this function.
  return surroundingAgent.Throw('Error', 'Date.prototype.toLocaleDateString is not implemented');
}

// 20.3.4.39 #sec-date.prototype.tolocalestring
function DateProto_toLocaleString() {
  // TODO: implement this function.
  return surroundingAgent.Throw('Error', 'Date.prototype.toLocaleString is not implemented');
}

// 20.3.4.40 #sec-date.prototype.tolocaletimestring
function DateProto_toLocaleTimeString() {
  // TODO: implement this function.
  return surroundingAgent.Throw('Error', 'Date.prototype.toLocaleTimeString is not implemented');
}

// 20.3.4.41 #sec-date.prototype.tostring
function DateProto_toString(args, { thisValue }) {
  const tv = Q(thisTimeValue(thisValue));
  return ToDateString(tv);
}

// 20.3.4.41.1 #sec-timestring
function TimeString(tv) {
  Assert(Type(tv) === 'Number');
  Assert(!tv.isNaN());
  const hour = String(HourFromTime(tv).numberValue()).padStart(2, '0');
  const minute = String(MinFromTime(tv).numberValue()).padStart(2, '0');
  const second = String(SecFromTime(tv).numberValue()).padStart(2, '0');
  return new Value(`${hour}:${minute}:${second} GMT`);
}

// 20.3.4.41.2 #sec-datestring
function DateString(tv) {
  Assert(Type(tv) === 'Number');
  Assert(!tv.isNaN());
  const weekday = daysOfTheWeek[WeekDay(tv).numberValue()];
  const month = monthsOfTheYear[MonthFromTime(tv).numberValue()];
  const day = String(DateFromTime(tv).numberValue()).padStart(2, '0');
  const year = String(YearFromTime(tv).numberValue()).padStart(4, '0');
  return new Value(`${weekday} ${month} ${day} ${year}`);
}

// Table 46 #sec-todatestring-day-names
const daysOfTheWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Table 47 #sec-todatestring-month-names
const monthsOfTheYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 20.3.4.41.3 #sec-timezoneestring
export function TimeZoneString(tv) {
  Assert(Type(tv) === 'Number');
  Assert(!tv.isNaN());
  const offset = LocalTZA(tv, true);
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetMin = String(MinFromTime(new Value(Math.abs(offset))).numberValue()).padStart(2, '0');
  const offsetHour = String(HourFromTime(new Value(Math.abs(offset))).numberValue()).padStart(2, '0');
  const tzName = '';
  return new Value(`${offsetSign}${offsetHour}${offsetMin}${tzName}`);
}

// 20.3.4.41.4 #sec-todatestring
export function ToDateString(tv) {
  Assert(Type(tv) === 'Number');
  if (tv.isNaN()) {
    return new Value('Invalid Date');
  }
  const t = LocalTime(tv);
  return new Value(`${DateString(t).stringValue()} ${TimeString(t).stringValue()}${TimeZoneString(t).stringValue()}`);
}

// 20.3.4.42 #sec-date.prototype.totimestring
function DateProto_toTimeString(args, { thisValue }) {
  const O = thisValue;
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', msg('IncompatibleReceiver', 'Date.prototype.toTimeString'));
  }
  const tv = Q(thisTimeValue(O));
  if (tv.isNaN()) {
    return new Value('Invalid Date');
  }
  const t = LocalTime(tv);
  return new Value(`${TimeString(t).stringValue()}${TimeZoneString(tv).stringValue()}`);
}

// 20.3.4.43 #sec-date.prototype.toutcstring
function DateProto_toUTCString(args, { thisValue }) {
  const O = thisValue;
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', msg('IncompatibleReceiver', 'Date.prototype.toUTCString'));
  }
  const tv = Q(thisTimeValue(O));
  if (tv.isNaN()) {
    return new Value('Invalid Date');
  }
  const weekday = daysOfTheWeek[WeekDay(tv).numberValue()];
  const month = monthsOfTheYear[MonthFromTime(tv).numberValue()];
  const day = String(DateFromTime(tv).numberValue()).padStart(2, '0');
  const year = String(YearFromTime(tv).numberValue()).padStart(4, '0');
  return new Value(`${weekday}, ${day} ${month} ${year} ${TimeString(tv).stringValue()}`);
}

// 20.3.4.44 #sec-date.prototype.valueof
function DateProto_valueOf(args, { thisValue }) {
  return Q(thisTimeValue(thisValue));
}

// 20.3.4.45 #sec-date.prototype-@@toprimitive
function DateProto_toPrimitive([hint = Value.undefined], { thisValue }) {
  const O = thisValue;
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', msg('IncompatibleReceiver', 'Date.prototype[@@toPrimitive]'));
  }
  let tryFirst;
  if (Type(hint) === 'String' && (hint.stringValue() === 'string' || hint.stringValue() === 'default')) {
    tryFirst = new Value('string');
  } else if (Type(hint) === 'String' && hint.stringValue() === 'number') {
    tryFirst = new Value('number');
  } else {
    return surroundingAgent.Throw('TypeError', msg('InvalidHint', hint));
  }
  return Q(OrdinaryToPrimitive(O, tryFirst));
}

export function CreateDatePrototype(realmRec) {
  const proto = BootstrapPrototype(realmRec, [
    ['getDate', DateProto_getDate, 0],
    ['getDay', DateProto_getDay, 0],
    ['getFullYear', DateProto_getFullYear, 0],
    ['getHours', DateProto_getHours, 0],
    ['getMilliseconds', DateProto_getMilliseconds, 0],
    ['getMinutes', DateProto_getMinutes, 0],
    ['getMonth', DateProto_getMonth, 0],
    ['getSeconds', DateProto_getSeconds, 0],
    ['getTime', DateProto_getTime, 0],
    ['getTimezoneOffset', DateProto_getTimezoneOffset, 0],
    ['getUTCDate', DateProto_getUTCDate, 0],
    ['getUTCDay', DateProto_getUTCDay, 0],
    ['getUTCFullYear', DateProto_getUTCFullYear, 0],
    ['getUTCHours', DateProto_getUTCHours, 0],
    ['getUTCMilliseconds', DateProto_getUTCMilliseconds, 0],
    ['getUTCMinutes', DateProto_getUTCMinutes, 0],
    ['getUTCMonth', DateProto_getUTCMonth, 0],
    ['getUTCSeconds', DateProto_getUTCSeconds, 0],
    ['setDate', DateProto_setDate, 1],
    ['setFullYear', DateProto_setFullYear, 3],
    ['setHours', DateProto_setHours, 4],
    ['setMilliseconds', DateProto_setMilliseconds, 1],
    ['setMinutes', DateProto_setMinutes, 3],
    ['setMonth', DateProto_setMonth, 2],
    ['setSeconds', DateProto_setSeconds, 2],
    ['setTime', DateProto_setTime, 1],
    ['setUTCDate', DateProto_setUTCDate, 1],
    ['setUTCFullYear', DateProto_setUTCFullYear, 3],
    ['setUTCHours', DateProto_setUTCHours, 4],
    ['setUTCMilliseconds', DateProto_setUTCMilliseconds, 1],
    ['setUTCMinutes', DateProto_setUTCMinutes, 3],
    ['setUTCMonth', DateProto_setUTCMonth, 2],
    ['setUTCSeconds', DateProto_setUTCSeconds, 2],
    ['toDateString', DateProto_toDateString, 0],
    ['toISOString', DateProto_toISOString, 0],
    ['toJSON', DateProto_toJSON, 1],
    ['toLocaleDateString', DateProto_toLocaleDateString, 0],
    ['toLocaleString', DateProto_toLocaleString, 0],
    ['toLocaleTimeString', DateProto_toLocaleTimeString, 0],
    ['toString', DateProto_toString, 0],
    ['toTimeString', DateProto_toTimeString, 0],
    ['toUTCString', DateProto_toUTCString, 0],
    ['valueOf', DateProto_valueOf, 0],
    [wellKnownSymbols.toPrimitive, DateProto_toPrimitive, 1, { Writable: Value.false, Enumerable: Value.false, Configurable: Value.true }],
  ], realmRec.Intrinsics['%ObjectPrototype%']);

  realmRec.Intrinsics['%DatePrototype%'] = proto;
}
