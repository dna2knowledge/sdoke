export function lr(data){
    if (!data || data.length <= 1) return { k: 0, b: 0 }
    const xsum = data.map((_, i) => i).reduce((a, b) => a+b, 0);
    const ysum = data.reduce((a, b) => a+b, 0);

    const xmean = xsum/data.length;
    const ymean = ysum/data.length;

    const num = data.map((v, i) => (i-xmean)*(v-ymean)).reduce((a, b) => a+b, 0);
    const den = data.map((v, i) => (i-xmean)*(i-xmean)).reduce((a, b) => a+b, 0);

    // y = kx+b
    const k = num / den;
    const b = ymean - k * xmean;

    return { k, b };
}