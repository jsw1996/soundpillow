import type { WebAudioNode } from '../types';

/** Clean up a single WebAudio node (pause, disconnect, clear src) */
export function cleanupAudioNode(node: WebAudioNode): void {
  node.element.pause();
  node.element.src = '';
  node.source.disconnect();
  node.gain.disconnect();
}

/** Clean up all nodes in a Map and clear it */
export function cleanupAudioNodes(nodes: Map<string, WebAudioNode>): void {
  nodes.forEach(cleanupAudioNode);
  nodes.clear();
}
