// This helps in obtaining a timestamp based version string for local development.
const ComputeVersion = () => {
  const now = new Date();
  const major = `1`;
  const minor = `${Pad(now.getFullYear(), 4)}${Pad(now.getMonth(), 2)}${Pad(now.getDate(), 2)}`;
  const patch = `${Pad(now.getSeconds() + (60 * (now.getMinutes() + (60 * now.getHours()))), 5)}`;
  const version =`${major}.${minor}.${patch}`;
  return {
    major,
    minor,
    patch,
    full: version
  }
}

function Pad(text, width, z = '0')
{
    text = text + ''; // convert to string
    while(text.length < width) {
        text = z + text;
    }
    return text;
}

module.exports = {
    ComputeVersion
}
