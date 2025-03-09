// ydm.js - 使用请求头中的aut值作为密钥

// 存储最后一次有效的密钥
let lastValidKey = "JhbGciOiJIUzI1Ni"; // 默认密钥作为备用

function main() {
  // 尝试从请求头获取并更新密钥
  updateKeyFromHeader();
  
  let body = $response.body;
  
  try {
    // 检查响应格式
    const jsonData = JSON.parse(body);
    
    if (jsonData.code === 200 && jsonData.msg === "success" && jsonData.encData) {
      // 处理加密内容
      const encryptedData = jsonData.encData;
      const decrypted = decryptData(encryptedData);
      
      // 将所有false替换为true
      const modifiedData = decrypted.replace(/false/g, "true");
      
      // 重新加密
      const newEncryptedData = encryptData(modifiedData);
      
      // 替换回去
      jsonData.encData = newEncryptedData;
      body = JSON.stringify(jsonData);
    }
  } catch (e) {
    console.log(`处理失败: ${e.message}`);
  }
  
  $done({ body });
}

// 从请求头获取并更新密钥
function updateKeyFromHeader() {
  if ($request && $request.headers) {
    const aut = $request.headers["aut"] || $request.headers["Aut"] || $request.headers["AUT"];
    
    if (aut && aut.length >= 18) {
      // 提取第2-17位
      const newKey = aut.slice(2, 18);
      console.log(`从aut获取新密钥: ${newKey}`);
      
      // 更新密钥
      lastValidKey = newKey;
      
      // 可以选择持久化存储密钥
      $persistentStore.write(newKey, "ydmDecryptKey");
    }
  } else {
    // 尝试从持久化存储读取之前保存的密钥
    const savedKey = $persistentStore.read("ydmDecryptKey");
    if (savedKey) {
      lastValidKey = savedKey;
    }
  }
}

function decryptData(encryptedBase64) {
  const CryptoJS = $crypto.AES;
  const keyBytes = CryptoJS.enc.Utf8.parse(lastValidKey);
  const iv = CryptoJS.enc.Utf8.parse(lastValidKey);
  
  const decrypted = CryptoJS.decrypt(encryptedBase64, keyBytes, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function encryptData(plaintext) {
  const CryptoJS = $crypto.AES;
  const keyBytes = CryptoJS.enc.Utf8.parse(lastValidKey);
  const iv = CryptoJS.enc.Utf8.parse(lastValidKey);
  
  const encrypted = CryptoJS.encrypt(plaintext, keyBytes, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return encrypted.toString();
}

main();