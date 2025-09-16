import Foundation

class Storage {
    static let shared = Storage()

    private let mmkv = MMKV.default()

    func setItem(_ value: String, forKey key: String) {
        mmkv?.set(value, forKey: key)
    }

    func getItem(forKey key: String) -> String? {
        return mmkv?.string(forKey: key)
    }
}
