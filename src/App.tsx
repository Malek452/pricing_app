import { useEffect, useMemo, useState } from 'react'
import './App.css'

type MaterialOption = {
  id: string
  category: 'ورق' | 'بلاستيك' | 'شفاف' | 'ليزري'
  baseColor?: string
  factorOver10k: number
  factorUnderOrEq10k: number
  requiresColor: boolean
}

type FactorsConfig = {
  exchangeRate: number
  materials: MaterialOption[]
  extraColorFactor: {
    twoColors: number
    threeOrMoreColors: number
  }
}

const fallbackConfig: FactorsConfig = {
  exchangeRate: 12000,
  materials: [
    { id: 'paper-white', category: 'ورق', baseColor: 'أبيض', factorOver10k: 15, factorUnderOrEq10k: 20, requiresColor: true },
    { id: 'paper-black', category: 'ورق', baseColor: 'أسود', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'paper-gold-gloss', category: 'ورق', baseColor: 'ذهبي لامع', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'paper-gold-matte', category: 'ورق', baseColor: 'ذهبي مت', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'paper-silver-gloss', category: 'ورق', baseColor: 'فضي لامع', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'paper-silver-matte', category: 'ورق', baseColor: 'فضي مت', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-white', category: 'بلاستيك', baseColor: 'أبيض', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-black', category: 'بلاستيك', baseColor: 'أسود', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-gold-gloss', category: 'بلاستيك', baseColor: 'ذهبي لامع', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-gold-matte', category: 'بلاستيك', baseColor: 'ذهبي مت', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-silver-gloss', category: 'بلاستيك', baseColor: 'فضي لامع', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'plastic-silver-matte', category: 'بلاستيك', baseColor: 'فضي مت', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'transparent', category: 'شفاف', baseColor: 'شفاف', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: false },
    { id: 'laser-gold', category: 'ليزري', baseColor: 'ذهبي', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
    { id: 'laser-silver', category: 'ليزري', baseColor: 'فضي', factorOver10k: 20, factorUnderOrEq10k: 25, requiresColor: true },
  ],
  extraColorFactor: {
    twoColors: 3,
    threeOrMoreColors: 6,
  },
}

const printingColors = [
  'أبيض',
  'أسود',
  'احمر',
  'ازرق',
  'اخضر',
  'برتقالي',
  'اصفر',
  'ذهبي',
  'فضي',
  'ليزري ذهبي',
  'ليزري فضي',
]

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '—'

const findMaterial = (options: MaterialOption[], category: string, baseColor?: string) =>
  options.find((m) => m.category === category && (baseColor ? m.baseColor === baseColor : true))

function App() {
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>(fallbackConfig.materials)
  const [quantity, setQuantity] = useState<number>(1000)
  const [lengthMm, setLengthMm] = useState<number>(10)
  const [widthMm, setWidthMm] = useState<number>(10)
  const [defaultExchangeRate, setDefaultExchangeRate] = useState<number>(fallbackConfig.exchangeRate)
  const [exchangeRate, setExchangeRate] = useState<number>(fallbackConfig.exchangeRate)
  const [extraColorFactorConfig, setExtraColorFactorConfig] = useState(fallbackConfig.extraColorFactor)
  const [selectedCategory, setSelectedCategory] = useState<MaterialOption['category']>('ورق')
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>('أبيض')
  const [selectedPrintingColors, setSelectedPrintingColors] = useState<string[]>(['أبيض'])
  const [colorLimitMessage, setColorLimitMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configUrl = `${import.meta.env.BASE_URL}config/factors.json`
        const response = await fetch(configUrl, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Failed to fetch config: ${response.status}`)
        const data = (await response.json()) as Partial<FactorsConfig>

        if (data.materials?.length) setMaterialOptions(data.materials)
        if (data.extraColorFactor) {
          setExtraColorFactorConfig({
            twoColors: data.extraColorFactor.twoColors ?? fallbackConfig.extraColorFactor.twoColors,
            threeOrMoreColors:
              data.extraColorFactor.threeOrMoreColors ?? fallbackConfig.extraColorFactor.threeOrMoreColors,
          })
        }
        if (typeof data.exchangeRate === 'number') {
          setDefaultExchangeRate(data.exchangeRate)
          setExchangeRate(data.exchangeRate)
        }
      } catch (error) {
        console.error('تعذر تحميل ملف factors.json، سيتم استخدام القيم الافتراضية.', error)
      }
    }

    loadConfig()
  }, [])

  const availableColors = useMemo(
    () => materialOptions.filter((m) => m.category === selectedCategory).map((m) => m.baseColor ?? '—'),
    [materialOptions, selectedCategory],
  )

  useEffect(() => {
    if (!availableColors.includes(selectedBaseColor)) {
      setSelectedBaseColor(availableColors[0] ?? '')
    }
    // reset color-limit notice when category changes
    setColorLimitMessage(null)
  }, [availableColors, selectedBaseColor])

  const selectedMaterial = useMemo(
    () => findMaterial(materialOptions, selectedCategory, selectedBaseColor),
    [materialOptions, selectedCategory, selectedBaseColor],
  )

  const area = useMemo(() => {
    if (lengthMm <= 0 || widthMm <= 0) return 0
    return (lengthMm * widthMm) / 100
  }, [lengthMm, widthMm])

  const baseFactor = useMemo(() => {
    if (!selectedMaterial || quantity <= 0) return 0
    return quantity > 10000 ? selectedMaterial.factorOver10k : selectedMaterial.factorUnderOrEq10k
  }, [quantity, selectedMaterial])

  const extraColorFactor = useMemo(() => {
    const count = selectedPrintingColors.length
    if (count <= 1) return 0
    if (count === 2) return extraColorFactorConfig.twoColors
    return extraColorFactorConfig.threeOrMoreColors
  }, [extraColorFactorConfig.threeOrMoreColors, extraColorFactorConfig.twoColors, selectedPrintingColors.length])

  const finalFactor = baseFactor + extraColorFactor // يمكن تعديل طريقة دمج العوامل هنا إذا كانت المعادلة مختلفة.

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (quantity <= 0) errors.push('العدد يجب أن يكون أكبر من صفر.')
    if (lengthMm <= 0) errors.push('الطول يجب أن يكون أكبر من صفر.')
    if (widthMm <= 0) errors.push('العرض يجب أن يكون أكبر من صفر.')
    if (!selectedCategory) errors.push('الرجاء اختيار الخامة.')
    const requiresColor = selectedMaterial?.requiresColor ?? true
    if (requiresColor && !selectedBaseColor) errors.push('الرجاء اختيار لون الخامة.')
    if (selectedPrintingColors.length === 0) errors.push('اختر لون طباعة واحد على الأقل.')
    if (selectedPrintingColors.length > 3) errors.push('يمكن اختيار 3 ألوان طباعة كحد أقصى.')
    return errors
  }, [quantity, lengthMm, widthMm, selectedCategory, selectedBaseColor, selectedPrintingColors.length, selectedMaterial])

  const isValid = validationErrors.length === 0
  const pricePer1000 = isValid ? finalFactor * area * exchangeRate : 0
  const totalPrice = isValid ? (pricePer1000 * quantity) / 1000 : 0

  const handleToggleColor = (color: string) => {
    const exists = selectedPrintingColors.includes(color)
    if (exists) {
      setSelectedPrintingColors(selectedPrintingColors.filter((c) => c !== color))
      setColorLimitMessage(null)
      return
    }
    if (selectedPrintingColors.length >= 3) {
      setColorLimitMessage('يمكن اختيار 3 ألوان كحد أقصى.')
      return
    }
    setSelectedPrintingColors([...selectedPrintingColors, color])
    setColorLimitMessage(null)
  }

  const handleReset = () => {
    setQuantity(1000)
    setLengthMm(50)
    setWidthMm(50)
    setExchangeRate(defaultExchangeRate)
    setSelectedCategory('ورق')
    setSelectedBaseColor('أبيض')
    setSelectedPrintingColors(['أبيض'])
    setColorLimitMessage(null)
  }

  return (
    <div className="app" dir="rtl">
      <header className="header brand-header">
        <div className="brand">
          <img
            src={`${import.meta.env.BASE_URL}basma_logo.JPG`}
            alt="شعار بصمة اتيكيت"
            className="brand-logo"
          />
          <div className="brand-text">
            <h1>بصمة اتيكيت</h1>
            <p className="lead">حاسبة التسعير للحساب السريع وفق الخامة والألوان والكمية.</p>
          </div>
        </div>
      </header>

      {validationErrors.length > 0 && (
        <div className="error-panel">
          <strong>يرجى تصحيح التالي:</strong>
          <ul>
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="layout">
        <section className="card">
          <h2>مواصفات الطلب</h2>
          <div className="grid two-col">
            <label className="field">
              <span>العدد</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>الطول (مم)</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                pattern="[0-9]*"
                value={lengthMm}
                onChange={(e) => setLengthMm(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>العرض (مم)</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                pattern="[0-9]*"
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>الخامة واللون</h2>
          <div className="field">
            <span className="label-inline">الخامة</span>
            <div className="chips">
              {(['ورق', 'بلاستيك', 'شفاف', 'ليزري'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {selectedCategory !== 'شفاف' && (
            <div className="field">
              <span className="label-inline">لون الخامة</span>
              <div className="chips">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    className={`chip ${selectedBaseColor === color ? 'active' : ''}`}
                    onClick={() => setSelectedBaseColor(color)}
                    type="button"
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>ألوان الطباعة</h2>
          <p className="hint">اختر من 1 إلى 3 ألوان.</p>
          <div className="chips">
            {printingColors.map((color) => (
              <button
                key={color}
                className={`chip ${selectedPrintingColors.includes(color) ? 'active' : ''}`}
                onClick={() => handleToggleColor(color)}
                type="button"
              >
                {color}
              </button>
            ))}
          </div>
          {colorLimitMessage && <div className="inline-error">{colorLimitMessage}</div>}
        </section>

        <section className="card wide">
          <h2>النتائج</h2>
          <div className="results-grid">
            <div>
              <span className="result-label">المساحة (سم²)</span>
              <div className="result-value">{formatNumber(area)}</div>
            </div>
            <div>
              <span className="result-label">سعر الألف قطعة</span>
              <div className="result-highlight">{formatNumber(pricePer1000)} دولار</div>
            </div>
            <div>
              <span className="result-label">الإجمالي (اختياري)</span>
              <div className="result-muted">{formatNumber(totalPrice)} دولار</div>
            </div>
          </div>
          {!isValid && <p className="note">الإجمالي يظهر عندما تكون المدخلات صحيحة.</p>}
        </section>
      </div>

      <button className="ghost" type="button" onClick={handleReset}>
        إعادة تعيين
      </button>
    </div>
  )
}

export default App
