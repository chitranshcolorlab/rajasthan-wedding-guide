// A retry uses the same opaque request ID; the backend stores it with the row.
async function submitRegistrationWithRetry(url, payload, fetchImpl = fetch, pause = ms => new Promise(r => setTimeout(r, ms))) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchImpl(url, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
      if (!response.ok) {
        const error = new Error('Server response could not be confirmed.');
        error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        throw error;
      }
      let result;
      try { result = await response.json(); } catch { throw new Error('Server confirmation could not be read.'); }
      if (!result || result.ok !== true || !result.id) {
        const error = new Error(result && result.error || 'Registration could not be confirmed.');
        error.confirmedFailure = true;
        error.code = result && result.code;
        throw error;
      }
      return result;
    } catch (error) {
      if (error.confirmedFailure || error.retryable === false || attempt === 2) throw error;
      await pause(1000 * (attempt + 1));
    }
  }
}
if (typeof module !== 'undefined') module.exports = {submitRegistrationWithRetry};
