# md4shim: restore MD4 for pywinrm NTLM on Python 3.12 (OpenSSL 3 dropped MD4 from the default provider).
# import this BEFORE winrm; it monkeypatches hashlib.new('md4'). Pure-python, no deps.
import struct, hashlib

def _lrot(x, n): return ((x << n) | (x >> (32 - n))) & 0xffffffff

def _md4(msg):
    msg = bytearray(msg); ln = (8*len(msg)) & 0xffffffffffffffff
    msg.append(0x80)
    while len(msg) % 64 != 56: msg.append(0)
    msg += struct.pack('<Q', ln)
    A,B,C,D = 0x67452301,0xefcdab89,0x98badcfe,0x10325476
    for off in range(0,len(msg),64):
        X = struct.unpack('<16I', msg[off:off+64]); a,b,c,d = A,B,C,D
        for k in range(16):  # round 1
            if   k%4==0: a=_lrot((a+((b&c)|(~b&d))+X[k])&0xffffffff,3)
            elif k%4==1: d=_lrot((d+((a&b)|(~a&c))+X[k])&0xffffffff,7)
            elif k%4==2: c=_lrot((c+((d&a)|(~d&b))+X[k])&0xffffffff,11)
            else:        b=_lrot((b+((c&d)|(~c&a))+X[k])&0xffffffff,19)
        o2=[0,4,8,12,1,5,9,13,2,6,10,14,3,7,11,15]
        for k in range(16):  # round 2
            i=o2[k]
            if   k%4==0: a=_lrot((a+((b&c)|(b&d)|(c&d))+X[i]+0x5a827999)&0xffffffff,3)
            elif k%4==1: d=_lrot((d+((a&b)|(a&c)|(b&c))+X[i]+0x5a827999)&0xffffffff,5)
            elif k%4==2: c=_lrot((c+((d&a)|(d&b)|(a&b))+X[i]+0x5a827999)&0xffffffff,9)
            else:        b=_lrot((b+((c&d)|(c&a)|(d&a))+X[i]+0x5a827999)&0xffffffff,13)
        o3=[0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15]
        for k in range(16):  # round 3
            i=o3[k]
            if   k%4==0: a=_lrot((a+(b^c^d)+X[i]+0x6ed9eba1)&0xffffffff,3)
            elif k%4==1: d=_lrot((d+(a^b^c)+X[i]+0x6ed9eba1)&0xffffffff,9)
            elif k%4==2: c=_lrot((c+(d^a^b)+X[i]+0x6ed9eba1)&0xffffffff,11)
            else:        b=_lrot((b+(c^d^a)+X[i]+0x6ed9eba1)&0xffffffff,15)
        A=(A+a)&0xffffffff; B=(B+b)&0xffffffff; C=(C+c)&0xffffffff; D=(D+d)&0xffffffff
    return struct.pack('<4I',A,B,C,D)

class _MD4:
    def __init__(self, data=b''): self._buf=bytearray(data)
    def update(self, data): self._buf+=data
    def digest(self): return _md4(bytes(self._buf))
    def hexdigest(self): return self.digest().hex()
    def copy(self): c=_MD4(); c._buf=bytearray(self._buf); return c

_orig=hashlib.new
def _new(name, data=b'', **kw):
    if isinstance(name,str) and name.lower()=='md4': return _MD4(data)
    return _orig(name, data, **kw)
hashlib.new=_new

if __name__=='__main__':
    import binascii
    vec={b'':'31d6cfe0d16ae931b73c59d7e0c089c0', b'abc':'a448017aaf21d8525fc10ae87aa6729d',
         b'message digest':'d9130a8164549fe818874806e1c7014b'}
    ok=all(binascii.hexlify(_md4(k)).decode()==v for k,v in vec.items())
    print('MD4-SELFTEST:', 'PASS' if ok else 'FAIL')
    print('hashlib.new md4:', hashlib.new('md4', b'abc').hexdigest())
