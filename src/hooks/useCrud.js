import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'antd'

// 35 дэлгэц бараг ижил CRUD хэв маягийг хуулж бичсэн байсан:
//   useState жагсаалт → useCallback load → Modal + Form → save() →
//   validateFields → api дуудлага → message → дахин ачаалах.
//
// Энэ хук тэр давхардлыг нэг дор төвлөрүүлнэ. Дэлгэц зөвхөн өөрийн
// онцлогийг (багана, талбар, шүүлтүүр) л бичнэ.
//
// Алдааны мессежийг api.js-ийн interceptor аль хэдийн харуулдаг тул энд
// давхар toast гаргахгүй — зөвхөн төлөв, ачаалалт, хэлбэр хөрвүүлэлтийг
// хариуцна.
//
// Жишээ:
//   const crud = useCrud({
//     list:   (p) => api.getChemicals(p),
//     create: (d) => api.createChemical(d),
//     update: (id, d) => api.updateChemical(id, d),
//     remove: (id) => api.deleteChemical(id),
//     toForm: (row) => ({ ...row, purchased_at: row.purchased_at && dayjs(row.purchased_at) }),
//     toApi:  (v) => ({ ...v, purchased_at: v.purchased_at?.format('YYYY-MM-DD') }),
//     params: { hazard_class: hazF },
//   })
//   <Table {...crud.tableProps} columns={cols} />
//   <Modal {...crud.modalProps} title={crud.editing ? 'Засах' : 'Нэмэх'}>
//     <Form {...crud.formProps}> … </Form>
//   </Modal>

export function useCrud({
  list,                       // (params) => Promise<{ data, pagination? }>
  create,                     // (payload) => Promise
  update,                     // (id, payload) => Promise
  remove,                     // (id) => Promise
  toForm = (row) => row,      // мөр → формын утга (огноог dayjs болгох гэх мэт)
  toApi = (values) => values, // формын утга → API биет
  defaults = {},              // шинээр нээхэд тавих анхдагч утга
  params = {},                // нэмэлт шүүлтүүр (өөрчлөгдөхөд дахин ачаална)
  pageSize = 25,
  autoLoad = true,
  onLoaded,                   // (rows, meta) => void — статистик зэрэгт
} = {}) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(autoLoad)
  const [saving, setSaving]   = useState(false)
  const [editing, setEditing] = useState(null)   // засаж буй мөрийн id, эсвэл null
  const [open, setOpen]       = useState(false)
  const [page, setPage]       = useState({ current: 1, pageSize, total: 0 })
  const [form]                = Form.useForm()

  // Шүүлтүүрийг тогтвортой түлхүүр болгож useCallback-ийн хамаарлыг барина —
  // объект шууд дамжуулбал render бүрд шинэ ишлэл болж мөчлөг үүсгэнэ.
  const paramsKey = JSON.stringify(params)
  const paramsRef = useRef(params)
  paramsRef.current = params
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded

  const load = useCallback(async (p = 1, size = pageSize) => {
    if (!list) return
    setLoading(true)
    try {
      const res = await list({ ...paramsRef.current, page: p, limit: size })
      const data = res?.data || []
      setRows(data)
      setPage({
        current: res?.pagination?.page || p,
        pageSize: res?.pagination?.limit || size,
        total: res?.pagination?.total ?? data.length,
      })
      onLoadedRef.current?.(data, res?.pagination)
    } catch {
      // interceptor аль хэдийн мессеж харуулсан; хуучин мөрүүдийг үлдээнэ
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, pageSize, paramsKey])

  useEffect(() => { if (autoLoad) load(1, pageSize) }, [load, autoLoad, pageSize])

  const openCreate = useCallback((preset = {}) => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ ...defaults, ...preset })
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, JSON.stringify(defaults)])

  const openEdit = useCallback((row) => {
    setEditing(row.id)
    form.resetFields()
    form.setFieldsValue(toForm(row))
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, toForm])

  const close = useCallback(() => setOpen(false), [])

  const save = useCallback(async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return false            // талбарын алдааг Form өөрөө харуулна
    }
    setSaving(true)
    try {
      const payload = toApi(values)
      if (editing) await update(editing, payload)
      else await create(payload)
      setOpen(false)
      await load(editing ? page.current : 1, page.pageSize)
      return true
    } catch {
      return false            // interceptor мессеж харуулсан; модаль нээлттэй үлдэнэ
    } finally {
      setSaving(false)
    }
  }, [form, toApi, editing, update, create, load, page.current, page.pageSize])

  const destroy = useCallback(async (id) => {
    try {
      await remove(id)
      // Сүүлийн мөрийг устгавал өмнөх хуудас руу шилжинэ
      const lastOnPage = rows.length === 1 && page.current > 1
      await load(lastOnPage ? page.current - 1 : page.current, page.pageSize)
      return true
    } catch {
      return false
    }
  }, [remove, load, rows.length, page.current, page.pageSize])

  const tableProps = useMemo(() => ({
    rowKey: 'id',
    size: 'small',
    loading,
    dataSource: rows,
    pagination: {
      ...page,
      showSizeChanger: false,
      onChange: (p, s) => load(p, s),
    },
  }), [loading, rows, page, load])

  const modalProps = useMemo(() => ({
    open,
    onOk: save,
    onCancel: close,
    confirmLoading: saving,
    okText: 'Хадгалах',
    cancelText: 'Болих',
    destroyOnClose: true,
  }), [open, save, close, saving])

  const formProps = useMemo(() => ({ form, layout: 'vertical' }), [form])

  return {
    rows, loading, saving, editing, open, page, form,
    load, reload: () => load(page.current, page.pageSize),
    openCreate, openEdit, close, save, destroy,
    tableProps, modalProps, formProps,
  }
}
