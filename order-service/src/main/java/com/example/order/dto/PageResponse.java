package com.example.order.dto;

import org.springframework.data.domain.Page;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class PageResponse<T> {

    private List<T> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
    private boolean hasNext;

    public PageResponse() {
    }

    public static <E, D> PageResponse<D> fromPage(Page<E> page, Function<E, D> mapper) {
        PageResponse<D> res = new PageResponse<>();
        res.setItems(page.getContent().stream().map(mapper).collect(Collectors.toList()));
        res.setPage(page.getNumber() + 1);
        res.setSize(page.getSize());
        res.setTotal(page.getTotalElements());
        res.setTotalPages(page.getTotalPages());
        res.setHasNext(page.hasNext());
        return res;
    }

    // Getters and Setters
    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isHasNext() { return hasNext; }
    public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
}
