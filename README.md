# Lab 06 – JSON ба SOAP Service Integration

## Төслийн товч тайлбар

Энэ лабораторийн ажлын зорилго нь SOAP болон JSON төрлийн хоёр өөр service хоорондын холбоог ойлгож, ажиллуулж үзэх юм. Систем нь хэрэглэгчийн бүртгэл болон нэвтрэлтийг SOAP service ашиглан хийж, хэрэглэгчийн profile мэдээллийг JSON REST service ашиглан удирддаг.

Өөрөөр хэлбэл authentication буюу нэвтрэх хэсэг нь SOAP service дээр байрлаж байгаа бол profile-ийн CRUD үйлдлүүд JSON service дээр хийгдэнэ.

JSON service нь хүсэлт хүлээж авахдаа token-ийг SOAP service рүү явуулж баталгаажуулсны дараа profile үйлдлийг гүйцэтгэдэг.

---

## Системийн үндсэн хэсгүүд

Энэ систем дараах үндсэн хэсгүүдээс бүрдэнэ.

- Frontend – хэрэглэгчийн интерфейс
- SOAP Service – бүртгэл болон нэвтрэлт
- JSON REST Service – profile мэдээлэл удирдах
- Database – хэрэглэгч болон profile мэдээллийг хадгалах

---

## Архитектурын ерөнхий ойлголт

Системийн ажиллах зарчим дараах байдлаар явагдана.

1. Хэрэглэгч frontend дээр register эсвэл login хийнэ.
2. Register болон login хүсэлт SOAP service рүү илгээгдэнэ.
3. SOAP service хэрэглэгчийг database дээр хадгалж эсвэл шалгана.
4. Login амжилттай бол token үүсгэнэ.
5. Frontend token-ийг хадгална.
6. Profile API руу хүсэлт явуулах үед token-ийг хамт явуулна.
7. JSON service SOAP service рүү token-ийг шалгуулах хүсэлт илгээнэ.
8. Token зөв бол profile үйлдэл хийгдэнэ.

---

## Ашигласан технологиуд

Энэ лабораторийн ажилд дараах технологиуд ашигласан.

- Java
- Spring Boot
- Spring Web Services (SOAP)
- Spring Web (REST API)
- Spring Data JPA
- H2 Database
- Maven
- Eclipse IDE

---

## SOAP Service үйлдлүүд

SOAP service нь дараах үндсэн operation-уудтай.

RegisterUser  
Шинэ хэрэглэгч бүртгэх.

LoginUser  
Хэрэглэгчийн username болон password-ийг шалгаж token үүсгэх.

ValidateToken  
Token хүчинтэй эсэхийг шалгах.

---

## REST API

JSON service нь profile мэдээлэлтэй холбоотой дараах REST API-уудтай.

POST /users  
Шинэ profile үүсгэх.

GET /users/{id}  
Тухайн id-тай profile мэдээллийг харах.

PUT /users/{id}  
Profile мэдээллийг шинэчлэх.

DELETE /users/{id}  
Profile устгах.

Эдгээр API-ууд нь token authentication ашигладаг.

---

## Authentication процесс

1. Хэрэглэгч login хийнэ.
2. SOAP service token үүсгэнэ.
3. Token frontend дээр хадгалагдана.
4. Frontend REST API руу хүсэлт явуулахдаа token-ийг header дээр илгээнэ.
5. JSON service SOAP service-ээс token баталгаажуулна.
6. Token хүчинтэй бол хүсэлтийг гүйцэтгэнэ.

---

## Өгөгдлийн сан

Энэ төсөлд H2 database ашигласан.

Database нь дараах мэдээллийг хадгална.

AuthUser  
- id  
- username  
- password  
- token  

UserProfile  
- id  
- userId  
- name  
- email  
- bio  
- phone  

---

## Системийг ажиллуулах

1. SOAP service project-ийг Eclipse дээр нээнэ.
2. Spring Boot application-ийг ажиллуулна.
3. JSON service project-ийг ажиллуулна.
4. Frontend файлуудыг browser дээр нээнэ.
5. Register → Login → Profile үйлдлүүдийг туршиж болно.

---

## Дүгнэлт

Энэ лабораторийн ажлаар SOAP болон REST service-үүдийг хамт ашиглах, мөн service хооронд token ашиглан authentication хийх зарчмыг ойлгож туршиж үзсэн.