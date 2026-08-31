// dayjs дээр ажилладаг DatePicker / TimePicker.
//
// АСУУДАЛ: энэ төсөл antd v4 ашигладаг бөгөөд antd v4-ийн DatePicker нь
// `rc-picker/es/generate/moment` буюу MOMENT объект хүлээж авдаг. Гэтэл
// кодын бүх дэлгэц `dayjs()` дамжуулдаг. dayjs дээр moment-ийн `.weekday()`
// байхгүй тул хуанли нээгдэх мөчид:
//     Uncaught TypeError: n.weekday is not a function
// гэж уначихдаг байсан.
//
// ШИЙДЭЛ: antd-ийн албан ёсны «өөр огнооны сан ашиглах» зам —
// `generatePicker`-т dayjs-ийн тохиргоог өгч picker-ээ өөрсдөө үүсгэнэ.
// Ингэснээр 22 дэлгэцийн dayjs код хэвээр үлдэж, зөвхөн импорт солигдоно:
//     import { DatePicker } from 'antd'        ✗
//     import DatePicker from 'src/components/DatePicker'   ✓
import generatePicker from 'antd/es/date-picker/generatePicker'
import dayjsGenerateConfig from 'rc-picker/es/generate/dayjs'

// ЗАГВАР: энд `antd/es/date-picker/style/index` импортлож БОЛОХГҮЙ — тэр нь
// .less татдаг бөгөөд төсөлд `less` суугаагүй тул Vite шууд унана. Аппликейшн
// src/index.js дотор `antd/dist/antd.min.css`-ээр бүх загварыг ачаалчихсан,
// generatePicker нь ижил `.ant-picker` классуудыг үүсгэдэг тул загвар бэлэн.

const DatePicker = generatePicker(dayjsGenerateConfig)

// generatePicker өөрөө TimePicker / RangePicker-ийг хавсаргадаг тул
// тэдгээр нь ч мөн dayjs дээр ажиллана.
export const { TimePicker, RangePicker, MonthPicker, WeekPicker, YearPicker } = DatePicker

export default DatePicker
