let _nextId = 1;

export function nextId(): number {
  return _nextId++;
}

export default nextId;
