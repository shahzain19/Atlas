#pragma once

#include <string>
#include <cstdint>
#include <cstring>
#include <system_error>
#include <cerrno>

#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>

namespace atlas {

class SharedMemoryManager {
  std::string name_;
  int fd_ = -1;
  void* mapped_ = nullptr;
  size_t size_ = 0;

public:
  explicit SharedMemoryManager(std::string name) : name_(std::move(name)) {}

  ~SharedMemoryManager() {
    close();
    shm_unlink(name_.c_str());
  }

  SharedMemoryManager(const SharedMemoryManager&) = delete;
  SharedMemoryManager& operator=(const SharedMemoryManager&) = delete;
  SharedMemoryManager(SharedMemoryManager&& other) noexcept
    : name_(std::move(other.name_)), fd_(other.fd_), mapped_(other.mapped_), size_(other.size_) {
    other.fd_ = -1;
    other.mapped_ = nullptr;
    other.size_ = 0;
  }

  void create(size_t size) {
    if (mapped_) close();

    fd_ = shm_open(name_.c_str(), O_CREAT | O_RDWR, 0666);
    if (fd_ < 0) throw std::system_error(errno, std::generic_category(), "shm_open failed");

    if (ftruncate(fd_, static_cast<off_t>(size)) < 0) {
      ::close(fd_); fd_ = -1;
      shm_unlink(name_.c_str());
      throw std::system_error(errno, std::generic_category(), "ftruncate failed");
    }

    mapped_ = mmap(nullptr, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd_, 0);
    if (mapped_ == MAP_FAILED) {
      ::close(fd_); fd_ = -1;
      shm_unlink(name_.c_str());
      throw std::system_error(errno, std::generic_category(), "mmap failed");
    }

    size_ = size;
    ::close(fd_);
    fd_ = -1;
  }

  void* data() { return mapped_; }
  const void* data() const { return mapped_; }
  size_t size() const { return size_; }
  const std::string& name() const { return name_; }

  void write(const void* src, size_t len) {
    if (!mapped_) throw std::runtime_error("SharedMemory not initialized");
    if (len > size_) len = size_;
    std::memcpy(mapped_, src, len);
  }

  void read(void* dst, size_t len) const {
    if (!mapped_) throw std::runtime_error("SharedMemory not initialized");
    if (len > size_) len = size_;
    std::memcpy(dst, mapped_, len);
  }

  void close() {
    if (mapped_) {
      munmap(mapped_, size_);
      mapped_ = nullptr;
    }
    if (fd_ >= 0) {
      ::close(fd_);
      fd_ = -1;
    }
    size_ = 0;
  }
};

} // namespace atlas
