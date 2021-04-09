import json
import os
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

from pathlib import Path

# webpagetest.org/easy
# latency in ms, speed in Mbps
networks = {
    'Slow 3G': {'latency': 400, 'rate': 0.4},
    'Regular 3G': {'latency': 300, 'rate': 1.5},
    'Fast 3G': {'latency': 150, 'rate': 1.6},
    '4G': {'latency': 170, 'rate': 9.0},
    'Cable': {'latency': 28, 'rate': 5.0},

    '00': {'latency': 0, 'rate': 50.0},
    '10': {'latency': 1000, 'rate': 50.0},
    '20': {'latency': 2000, 'rate': 50.0},
    '01': {'latency': 0, 'rate': 10.0},
    '11': {'latency': 1000, 'rate': 10.0},
    '21': {'latency': 2000, 'rate': 10.0},
    '02': {'latency': 0, 'rate': 2.0},
    '12': {'latency': 1000, 'rate': 2.0},
    '22': {'latency': 2000, 'rate': 2.0},
}

linestyle_dict = {
    'solid': "-",
    'dotted': ":",
    'dashed': "--",
    'dashdot': "-.",
}

order = ['bruteForce', 'referenceIndex',
         'referenceIndexNew', 'resourceTypeIndex', 'optimum']

plot_options = {
    'bruteForce': {
        'linestyle': "solid",
        'color': 'r',
        'name': 'Brute Force'
    },
    'referenceIndex': {
        'linestyle': "dashed",
        'color': 'b',
        'name': 'References'
    },
    'referenceIndexNew': {
        'linestyle': "dotted",
        'color': 'c',
        'name': 'References 2.0'
    },
    'resourceTypeIndex': {
        'linestyle': 'dashdot',
        'color': 'm',
        'name': 'ResourceType'

    },
    'optimum': {
        'linestyle': "solid",
        'color': 'g',
        'name': 'Optimum'
    }
}


def ensure_dir(file_path):
    dirname = '/'.join(file_path.split('/')[:-1])
    Path(dirname).mkdir(parents=True, exist_ok=True)

# Source: https://towardsdatascience.com/simple-linear-regression-in-python-numpy-only-130a988c0212


def linear_regression(x, y):
    N = len(x)
    x_mean = x.mean()
    y_mean = y.mean()

    B1_num = ((x - x_mean) * (y - y_mean)).sum()
    B1_den = ((x - x_mean)**2).sum()
    B1 = B1_num / B1_den

    B0 = y_mean - (B1*x_mean)

    reg_line = 'y = {} + {}β'.format(B0, round(B1, 3))

    return (B0, B1, reg_line)


def plot_x_queries(plot_data, querytype):
    for alg in order:
        algdata = plot_data[alg]

        x, y = [], []
        for i in range(3):
            x.append(i)
            y.append(np.mean(algdata['time_download_index']) +
                     i * np.mean(algdata['time_download_data']))

        color = plot_options[alg]['color']
        linestyle_key = plot_options[alg]['linestyle']
        linestyle = linestyle_dict[linestyle_key]
        algname = plot_options[alg]['name']
        # s to ms
        plt.plot(x, np.array(y) / 1000,
                 label=algname,
                 color=color,
                 linestyle=linestyle,
                 linewidth=1.5, marker='')

    plt.ylim(ymin=0)
    plt.xlim(0)
    plt.legend(loc='upper left')

    title = 'xqueries/' + (querytype if querytype else 'avg')
    plt.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.1)
    pdfpath = 'out/charts/pdf/' + title + '.pdf'
    pngpath = 'out/charts/png/' + title + '.png'
    ensure_dir(pdfpath)
    ensure_dir(pngpath)
    plt.savefig(pdfpath)
    plt.savefig(pngpath)
    plt.clf()


def plot_lines(result_file, network_name):
    dirname = os.path.dirname(__file__)
    resultpath = os.path.join(
        dirname, '../src/resources/testcases/results/' + result_file + '.json')

    network = networks[network_name]

    def getSortedMetric(algorithm, data, metric):
        x = data[algorithm]['x'][:]
        metricdata = data[algorithm][metric]
        xmetricdata = zip(x, metricdata)
        metricdata = [element for _, element in sorted(xmetricdata)]
        return metricdata

    def normalize(plotdata, metric, norm):
        for alg in plotdata:
            algfetches = np.mean(plotdata[alg][metric], axis=1)
            optimumfetches = np.mean(plotdata['optimum'][norm], axis=1)
            norm_metric = []
            for i in range(len(algfetches)):
                norm_metric.append([algfetches[i] / optimumfetches[i]])

            plotdata[alg][metric + '_normalized'] = norm_metric
        return plotdata

    def plotMetric(plot_options, metric, plotdata, axis_labels, skip, querytype, factor=1):
        linreg = []
        for alg in order:
            if alg in skip:
                continue
            color = plot_options[alg]['color']
            linestyle_key = plot_options[alg]['linestyle']
            linestyle = linestyle_dict[linestyle_key]
            algname = plot_options[alg]['name']

            metricdata = getSortedMetric(alg, plotdata, metric)
            # print(plotdata.shape)
            xdata = np.mean(getSortedMetric(
                'bruteForce', plotdata, 'fetches'), axis=1)

            mean = np.mean(metricdata, axis=1)
            lin_reg = linear_regression(xdata, mean)
            linreg.append(lin_reg[1])
            # if(alg == 'optimum'):
            #     print('factors', np.array(linreg) / lin_reg[1])
            # print(metric, alg, lin_reg)
            x_max = max(xdata)
            reg_0 = lin_reg[0] + lin_reg[1] * 0
            reg_max = lin_reg[0] + lin_reg[1] * x_max
            plt.plot([0, x_max], np.array([reg_0, reg_max]) * factor,
                     color=color, alpha=0.3, linestyle=linestyle)

            # percentile_up = np.percentile(
            #     metricdata, 100, axis=1)
            # percentile_low = np.percentile(
            #     metricdata, 0, axis=1)
            # plt.fill_between(xdata, percentile_low, percentile_up,
            #                  alpha=0.2, color=color)

            plt.plot(xdata, np.array(mean) * factor, label=algname, color=color,
                     linestyle=linestyle,
                     linewidth=1.5, marker='o')

        plt.legend(loc='upper left')
        title = metric + '/' + querytype if querytype else metric + '/avg'
        if metric in ['time_total', "time_download"]:
            title += "_" + network_name

        # plt.title(title)

        plt.xlabel(axis_labels[0])
        plt.ylabel(axis_labels[1])

        if(metric == 'time_total'):
            plt.ylim(0, 35)
        elif(metric == "time_download"):
            plt.ylim(0, 15)
        elif(metric == "time_download_data"):
            plt.ylim(0, 15)
        else:
            plt.ylim(0)

        plt.xlim(0)

        plt.yscale('linear')
        plt.grid(axis='y')

        plt.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.1)
        pdfpath = 'out/charts/pdf/' + title + '.pdf'
        pngpath = 'out/charts/png/' + title + '.png'
        ensure_dir(pdfpath)
        ensure_dir(pngpath)
        plt.savefig(pdfpath)
        plt.savefig(pngpath)
        plt.clf()

    def generate_charts(skip, querytype, plot_options):
        datalabels = []
        plotdata = {}

        with open(resultpath) as json_file:
            data = json.load(json_file)
            # iterate over algorithms
            for alg in data:
                plotdata[alg] = {
                    'x': [],
                    'fetches': [],
                    'time_creation': [],
                    'time_process': [],
                    'size_index': [],
                    'size_data': [],
                    'size_total': [],
                    'time_download': [],
                    'time_download_index': [],
                    'time_download_data': [],
                    'time_total': [],
                }

                datalabels.append(alg)
                algdata = data[alg]
                for dataset in algdata:
                    fetchresults = []
                    timeresults = []
                    indexsizes = []
                    datasizes = []
                    totalsizes = []
                    downloadtimes = []
                    downloadtimes_data = []
                    totaltimes = []
                    # iterate over testcases
                    for result in algdata[dataset]['testcases']:
                        if result['query'].startswith(querytype):
                            # Byte
                            datasize = result['dataSize']
                            indexsize = result['indexSize']
                            totalsize = datasize + indexsize
                            fetchresults.append(result['fetches'])
                            timeresult = result['time']
                            timeresults.append(timeresult)
                            datasizes.append(datasize)
                            indexsizes.append(indexsize)
                            totalsizes.append(totalsize)

                            latency_index = 1 * \
                                network['latency'] if indexsize > 2 else 0

                            def calculate_download_time(ds, l, r):
                                # data / rate in Byte/s to ms + latency
                                return ds / (r / 8 * 1000000) * 1000 + l

                            downloadtime_index = calculate_download_time(
                                indexsize, latency_index, network['rate']) / 1  # how many queries

                            # print(alg, downloadtime_index, (indexsize /
                            #                                 (network['rate'] / 8 * 1000000)), indexsize),

                            latency_data = float(
                                result['networkCalls']) * float(network['latency'])
                            # Mbit/s / 8 = MByte/s * 1000000 = Byte/s
                            # Byte / Byte/s = s * 1000 = ms
                            downloadtime_data = calculate_download_time(
                                datasize, latency_data, network['rate'])
                            # print(downloadtime_data, downloadtime_index)
                            downloadtime_total = downloadtime_data + downloadtime_index
                            downloadtimes_data.append(downloadtime_data)
                            downloadtimes.append(downloadtime_total)
                            # print(alg, result["query"], "latency_d", latency_data, "latency_i", latency_index, "downloadtime_data", downloadtime_data,
                            #       "downloadtime_index", downloadtime_index, 'downloadtime_total', downloadtime_total, 'total', downloadtime_total+timeresult)
                            totaltimes.append(downloadtime_total + timeresult)
                    plotdata[alg]['x'].append(int(dataset))
                    plotdata[alg]['fetches'].append(fetchresults)
                    plotdata[alg]['time_process'].append(timeresults)
                    plotdata[alg]['size_data'].append(datasizes)
                    plotdata[alg]['size_index'].append(indexsizes)
                    plotdata[alg]['size_total'].append(totalsizes)
                    plotdata[alg]['time_creation'].append([
                        algdata[dataset]['indexCreation']])
                    plotdata[alg]['time_download_data'].append(
                        downloadtimes_data)
                    plotdata[alg]['time_download_index'].append(
                        downloadtime_index)
                    plotdata[alg]['time_download'].append(downloadtimes)
                    plotdata[alg]['time_total'].append(totaltimes)
        print(querytype)
        plotMetric(plot_options, 'fetches', plotdata, [
            'Number of Resources', 'Number of Resources Fetched'], skip, querytype)
        plotMetric(plot_options, 'time_process', plotdata, [
            'Number of Resources', 'Time per Query in s'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'size_data', plotdata, [
            'Number of Resources', 'Resourcedata Fetched per Query in kB'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'size_index', plotdata, [
            'Number of Resources', 'Size of Index in Kilobytes'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'size_total', plotdata, [
            'Number of Resources', 'Size of Index and Resourcedata Fetched in kB'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'time_creation', plotdata, [
            'Number of Resources', 'Time of Index Creation in s'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'time_download', plotdata, [
            'Number of Resources', 'Download Time per Query in s'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'time_total', plotdata, [
            'Number of Resources', 'Time per Query in s'], skip, querytype, 1/1000)
        plotMetric(plot_options, 'time_download_data', plotdata, [
            'Number of Resources', 'Data Download Time per Query in s'], skip, querytype, 1/1000)

        # fetches normalized with fetches
        plotdata = normalize(plotdata, 'fetches', 'fetches')
        plotMetric(plot_options, 'fetches_normalized', plotdata, [
            'Number of Resources', 'Number of Resources Fetched / Number of Resources Matching'], skip, querytype)
        # time normalized with fetches
        plotdata = normalize(plotdata, 'time_process', 'fetches')
        plotMetric(plot_options, 'time_process_normalized', plotdata, [
            'Number of Resources', 'Number of Resources Fetched / Number of Resources Matching'], skip, querytype)
        # time normalized with time_total,
        plotdata = normalize(plotdata, 'time_total', 'time_total')
        plotMetric(plot_options, 'time_total_normalized', plotdata, [
            'Number of Resources', 'Number of Resources Fetched / Number of Resources Matching'], skip, querytype)

        plot_x_queries(plotdata, querytype)

    labels = ['bruteForce', 'referenceIndex',
              'referenceIndexNew', 'resourceTypeIndex', 'optimum']

    querytypes = ['']
    querytypes += ['has', 'ref', 'res', 'val']
    skip = []

    for querytype in querytypes:
        generate_charts(skip, querytype, plot_options)
