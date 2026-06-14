import gaokaoProvinces from '~/assets/gaokao.json';
import zhongkaoProvinces from '~/assets/zhongkao.json';

export type ExamType = 'gaokao' | 'zhongkao';

export interface ExamConfig {
  type: ExamType
  /** Hostname pattern for detection */
  hostname: string
  provinces: typeof gaokaoProvinces
  /** Display label for the exam */
  label: string
  /** Chinese display label */
  labelCn: string
  /** Whether to say 省份 or 城市 */
  regionLabel: string
  /** "不参加 XX 的地区已省略" */
  omittedText: string
  /** Title for the about modal */
  aboutTitle: string
  /** Prompt text in portal scene */
  portalPrompt: string
  /** UTM source */
  utmSource: string
}

const configs: Record<ExamType, ExamConfig> = {
  gaokao: {
    type: 'gaokao',
    hostname: 'gaokao',
    provinces: gaokaoProvinces,
    label: 'Gaokao',
    labelCn: '高考',
    regionLabel: '省份',
    omittedText: '不参加高考的地区已省略',
    aboutTitle: 'Gaokao Magic',
    portalPrompt: 'Prefill your Gaokao score',
    utmSource: 'gaokao-magic.by-ts.top',
  },
  zhongkao: {
    type: 'zhongkao',
    hostname: 'zhongkao',
    provinces: zhongkaoProvinces,
    label: 'Zhongkao',
    labelCn: '中考',
    regionLabel: '城市',
    omittedText: '不参加中考的城市已省略',
    aboutTitle: 'Zhongkao Magic',
    portalPrompt: 'Prefill your Zhongkao score',
    utmSource: 'zhongkao-magic.by-ts.top',
  },
};

function detectExamType(): ExamType {
  if (typeof window === 'undefined')
    return 'gaokao';
  const host = window.location.hostname;
  if (host.startsWith('zhongkao'))
    return 'zhongkao';
  return 'gaokao';
}

// TODO: report to upstream
// eslint-disable-next-line unused-imports/no-unused-vars
let currentExam: ReturnType<typeof ref<ExamConfig>>;

export function useExam() {
  const examType = detectExamType();
  return currentExam = ref(configs[examType]!);
}
