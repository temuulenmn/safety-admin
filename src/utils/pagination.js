// Хуудаслалтын мэдээллийг API-ийн хариултаас найдвартай уншина.
//
// Backend хоёр хэлбэрээр буцаадаг:
//   res_.paginated()  → { data, pagination: { total, page, limit, pages } }
//   гараар            → { data, total }              (accidents, notifications)
//
// Дэлгэцүүд `r.total` гэж уншдаг байсан тул `paginated()` хэрэглэдэг 7 дэлгэцэд
// total нь undefined болж `data.length`-д унаж, ХУУДАСЛАЛТ БҮРЭН АЖИЛЛАХГҮЙ
// байв — жагсаалт үргэлж 1-р хуудсан дээр гацдаг.
//
// Энэ функц хоёр хэлбэрийг хоёуланг нь ойлгоно.
export function pageInfo(res, fallbackPage = 1, fallbackSize = 25) {
  const data = res?.data || []
  const p = res?.pagination
  return {
    current: p?.page ?? fallbackPage,
    pageSize: p?.limit ?? fallbackSize,
    total: p?.total ?? res?.total ?? data.length,
  }
}
