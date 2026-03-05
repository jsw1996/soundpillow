import type { WebAudioNode } from '../types';
import type { RefObject } from 'react';

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

/** Get or lazily create an AudioContext, resuming if suspended (required for iOS) */
export function getOrCreateAudioContext(ref: RefObject<AudioContext | null>): AudioContext {
  if (!ref.current) ref.current = new AudioContext();
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

/** Close an AudioContext and null the ref */
export function closeAudioContext(ref: RefObject<AudioContext | null>): void {
  if (ref.current) {
    ref.current.close();
    ref.current = null;
  }
}
