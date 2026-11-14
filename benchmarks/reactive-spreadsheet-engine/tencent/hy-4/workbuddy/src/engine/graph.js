/**
 * Dependency-graph ordering.
 *
 * Edges point from a formula cell to the cells it reads: n -> d means
 * "n depends on d". Tarjan SCC finds every cycle (direct self reference or
 * multi-level indirect cycle); the condensation graph is then topologically
 * sorted so dependencies are always evaluated before their dependents.
 */

import { cellSortKey } from './cells.js';

/**
 * @param {Set<string>} affected cells that need recomputation
 * @param {(id:string) => Set<string>|Iterable<string>} depsOf direct precedents
 * @returns {{steps: Array<{id:string, cycle:boolean}>, cycleNodes: Set<string>}}
 */
export function orderForRecompute(affected, depsOf) {
  const nodes = [...affected].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  const nodeSet = new Set(nodes);
  const adj = new Map();
  for (const id of nodes) {
    const deps = [...(depsOf(id) || [])].filter((d) => nodeSet.has(d));
    adj.set(id, deps.sort((a, b) => cellSortKey(a) - cellSortKey(b)));
  }

  // --- Tarjan strongly connected components ---
  let counter = 0;
  const index = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const components = [];

  function strongConnect(v) {
    index.set(v, counter);
    low.set(v, counter);
    counter++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v)) {
      if (!index.has(w)) {
        strongConnect(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    }

    if (low.get(v) === index.get(v)) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      components.push(component);
    }
  }

  for (const id of nodes) {
    if (!index.has(id)) strongConnect(id);
  }

  const compOf = new Map();
  components.forEach((component, ci) => {
    for (const id of component) compOf.set(id, ci);
  });

  const cycleNodes = new Set();
  const cyclicComps = new Set();
  components.forEach((component, ci) => {
    const isCycle =
      component.length > 1 ||
      (component.length === 1 && adj.get(component[0]).includes(component[0]));
    if (isCycle) {
      cyclicComps.add(ci);
      for (const id of component) cycleNodes.add(id);
    }
  });

  // --- condensation DAG: dependency component -> dependent component ---
  const outgoing = new Map();
  for (let ci = 0; ci < components.length; ci++) outgoing.set(ci, new Set());
  for (const [v, deps] of adj) {
    const cv = compOf.get(v);
    for (const w of deps) {
      const cw = compOf.get(w);
      if (cv !== cw) outgoing.get(cw).add(cv); // cw must be computed before cv
    }
  }

  const indegree = new Array(components.length).fill(0);
  for (const targets of outgoing.values()) {
    for (const target of targets) indegree[target]++;
  }

  const queue = [];
  for (let ci = 0; ci < components.length; ci++) {
    if (indegree[ci] === 0) queue.push(ci);
  }
  const compOrder = [];
  while (queue.length) {
    const ci = queue.shift();
    compOrder.push(ci);
    for (const target of [...outgoing.get(ci)].sort((a, b) => a - b)) {
      indegree[target]--;
      if (indegree[target] === 0) queue.push(target);
    }
  }
  // Condensation is always a DAG; this is just defensive.
  for (let ci = 0; ci < components.length; ci++) {
    if (!compOrder.includes(ci)) compOrder.push(ci);
  }

  const steps = [];
  for (const ci of compOrder) {
    const members = [...components[ci]].sort((a, b) => cellSortKey(a) - cellSortKey(b));
    for (const id of members) steps.push({ id, cycle: cyclicComps.has(ci) });
  }

  return { steps, cycleNodes };
}
