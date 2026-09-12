I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: Açık ihbar API’si istemciden gelen ilçe, okul ve kategori alanlarını doğrulamıyor; bu da panel verisinin zehirlenmesine izin veriyor.

In `api/report.js`, validate `district`, `school_id`, `school_name`, and `category` against server-side canonical lists before inserting. Reject unknown schools, unknown categories, and district-school mismatches with a 422 response. Derive canonical `school_name` and `district` from the accepted school ID on the server instead of trusting client-provided text. Move the canonical school/category definitions into a shared server-consumable module so the API and frontend use the same source of truth.

### Relevant Files
- c:\Users\Tiger\guvenli-okul-pgm\api\report.js
- c:\Users\Tiger\guvenli-okul-pgm\js\data\schools.js
- c:\Users\Tiger\guvenli-okul-pgm\js\modules\utils.js
---