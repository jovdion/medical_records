import Catatan from "../models/CatatanModel.js";
import Users from "../models/Usermodel.js";

export const getCatatan = async (req, res) => {
    // Asumsi userId didapatkan dari sesi/token pengguna yang login
    const userId = req.userId; // <--- Anda perlu mendapatkan userId dari middleware autentikasi

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    try {
        // Mengambil semua catatan yang dimiliki oleh userId yang sedang login
        const response = await Catatan.findAll({
            where: {
                userId: userId // Filter catatan berdasarkan userId
            }
        });
        res.status(200).json(response);
    } catch (error) {
        console.error("Error getting notes:", error); // Log error lebih detail
        res.status(500).json({ message: error.message });
    }
};

// CREATE CATATAN
export const createCatatan = async (req, res) => {
    const { name, judul, isi_catatan } = req.body;
    const userId = req.userId; // <--- Anda perlu mendapatkan userId dari middleware autentikasi

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    // Tambahkan validasi untuk field yang diperlukan
    if (!name || !judul || !isi_catatan) {
        return res.status(400).json({ msg: "Nama, judul, dan isi catatan diperlukan." });
    }

    try {
        await Catatan.create({
            name: name,
            judul: judul,
            isi_catatan: isi_catatan,
            userId: userId // Sertakan userId dari pengguna yang login
        });
        res.status(201).json({ msg: "Catatan berhasil diupload" });
    } catch (error) {
        console.error("Error creating note:", error); // Log error lebih detail
        res.status(500).json({ message: error.message });
    }
};

// UPDATE CATATAN
export const updateCatatan = async (req, res) => {
    const userId = req.userId; // <--- Anda perlu mendapatkan userId dari middleware autentikasi
    const { judul, isi_catatan } = req.body; // Ambil data yang akan diupdate

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    // Tambahkan validasi untuk field yang diperlukan
    if (!judul || !isi_catatan) {
        return res.status(400).json({ msg: "Judul dan isi catatan diperlukan untuk pembaruan." });
    }

    try {
        const catatan = await Catatan.findOne({
            where: {
                catatan_id: req.params.id,
                userId: userId // Pastikan catatan ini milik user yang sedang login
            }
        });

        if (!catatan) {
            return res.status(404).json({ msg: "Catatan tidak ditemukan atau Anda tidak memiliki izin untuk mengedit catatan ini." });
        }
        
        await Catatan.update({ judul, isi_catatan }, { // Hanya update judul dan isi_catatan
            where: {
                catatan_id: req.params.id,
                userId: userId // Kriteria tambahan untuk keamanan
            }
        });
        res.status(200).json({ msg: "Catatan berhasil diperbarui" });
    } catch (error) {
        console.error("Error updating note:", error); // Log error lebih detail
        res.status(500).json({ message: error.message });
    }
};

// DELETE CATATAN
export const deleteCatatan = async (req, res) => {
    const userId = req.userId; // <--- Anda perlu mendapatkan userId dari middleware autentikasi

    if (!userId) {
        return res.status(401).json({ msg: "Autentikasi diperlukan. userId tidak ditemukan." });
    }

    try {
        const catatan = await Catatan.findOne({
            where: {
                catatan_id: req.params.id,
                userId: userId // Pastikan catatan ini milik user yang sedang login
            }
        });

        if (!catatan) {
            return res.status(404).json({ msg: "Catatan tidak ditemukan atau Anda tidak memiliki izin untuk menghapus catatan ini." });
        }
        
        await Catatan.destroy({
            where: {
                catatan_id: req.params.id,
                userId: userId // Kriteria tambahan untuk keamanan
            }
        });
        res.status(200).json({ msg: "Catatan berhasil dihapus" });
    } catch (error) {
        console.error("Error deleting note:", error); // Log error lebih detail
        res.status(500).json({ message: error.message });
    }
};
