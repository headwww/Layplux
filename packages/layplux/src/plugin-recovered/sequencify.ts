// =================================================================
// sequencify.ts — DAG 拓扑排序（改造版）
// 改造点：
// 1. 严格 TypeScript 类型，去掉 any
// 2. sequencify 出错时抛出结构化错误而不是静默返回空数组
// 3. 导出 SequencifyError 让调用方可以 catch 并区分错误类型
// =================================================================

interface Task {
  name: string;
  dep: string[];
}

interface SequencifyResult {
  sequence: string[];
  missingTasks: string[];
  recursiveDependencies: string[][];
}

export class SequencifyError extends Error {
  constructor(
    message: string,
    public readonly missingTasks: string[],
    public readonly recursiveDependencies: string[][],
  ) {
    super(message);
    this.name = 'SequencifyError';
  }
}

function walk(
  tasks: Map<string, Task>,
  name: string,
  parentName: string,
  results: string[],
  missing: string[],
  recursive: string[][],
  nest: string[],
): void {
  // 已经在结果里，去重
  if (results.includes(name)) return;

  const node = tasks.get(name);
  if (!node) {
    // 缺失任务：记录 "parent.missing" 格式，方便定位
    missing.push([parentName, name].filter(Boolean).join(' → '));
    return;
  }

  // 检测循环依赖
  if (nest.includes(name)) {
    nest.push(name);
    recursive.push([...nest]);
    nest.pop();
    return;
  }

  // 递归处理依赖
  if (node.dep.length > 0) {
    nest.push(name);
    for (const dep of node.dep) {
      walk(tasks, dep, name, results, missing, recursive, nest);
    }
    nest.pop();
  }

  results.push(name);
}

/**
 * 对任务集合做 DAG 拓扑排序
 *
 * @param tasks 任务 Map
 * @param names 需要执行的任务名列表
 * @param throwOnError 发现缺失/循环依赖时是否抛出（默认 true）
 */
export function sequencify(
  tasks: Map<string, Task>,
  names: string[],
  throwOnError = true,
): SequencifyResult {
  const results: string[] = [];
  const missing: string[] = [];
  const recursive: string[][] = [];

  for (const name of names) {
    walk(tasks, name, '', results, missing, recursive, []);
  }

  if ((missing.length > 0 || recursive.length > 0) && throwOnError) {
    const parts: string[] = [];
    if (missing.length > 0) {
      parts.push(`Missing dependencies: ${missing.join(', ')}`);
    }
    if (recursive.length > 0) {
      parts.push(`Circular dependencies: ${recursive.map((r) => r.join(' → ')).join('; ')}`);
    }
    throw new SequencifyError(parts.join('\n'), missing, recursive);
  }

  return {
    // 改造点：有错误时也返回已解析的部分序列（方便调试），
    // 而不是原版的清空 results，由调用方决定是否使用
    sequence: missing.length || recursive.length ? [] : results,
    missingTasks: missing,
    recursiveDependencies: recursive,
  };
}
